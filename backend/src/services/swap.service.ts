import { PrismaClient, ShiftRequestStatus, EmployeeLevel } from '@prisma/client';
import { addHours } from 'date-fns';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

interface SwapRequestWithDetails {
  id: string;
  shiftId: string;
  requestedById: string;
  acceptedById?: string | null;
  status: ShiftRequestStatus;
  reason?: string | null;
  createdAt: Date;
  resolvedAt?: Date | null;
  shift: {
    id: string;
    date: Date;
    type: string;
    startTime: string;
    endTime: string;
    employees: {
      id: string;
      fullName: string;
      level: EmployeeLevel;
      position: string;
    }[];
  };
  requestedBy: {
    id: string;
    fullName: string;
    level: EmployeeLevel;
    position: string;
  };
  acceptedBy?: {
    id: string;
    fullName: string;
    level: EmployeeLevel;
    position: string;
  } | null;
}

export class SwapService {
  /**
   * Create a new swap request
   */
  async createSwapRequest(userId: string, shiftId: string, reason?: string): Promise<SwapRequestWithDetails> {
    // Verify user exists and is assigned to this shift
    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        employees: {
          some: {
            id: userId
          }
        }
      },
      include: {
        employees: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    if (!shift) {
      throw new Error('משמרת לא נמצאה או שאינך משובץ אליה');
    }

    // Check if shift is not too close (minimum 4 hours before)
    const now = new Date();
    const shiftDateTime = new Date(shift.date);
    // Set the shift time based on start time
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    shiftDateTime.setHours(hours, minutes, 0, 0);

    const minimumNotice = addHours(now, 4);
    if (shiftDateTime <= minimumNotice) {
      throw new Error('לא ניתן לבקש החלפה פחות מ-4 שעות לפני המשמרת');
    }

    // Check if user already has a pending request for this shift
    const existingRequest = await prisma.swapRequest.findFirst({
      where: {
        shiftId,
        requestedById: userId,
        status: ShiftRequestStatus.PENDING
      }
    });

    if (existingRequest) {
      throw new Error('יש לך כבר בקשת החלפה פעילה עבור משמרת זו');
    }

    // Check if user has reached maximum open requests (2)
    const openRequestsCount = await prisma.swapRequest.count({
      where: {
        requestedById: userId,
        status: ShiftRequestStatus.PENDING
      }
    });

    if (openRequestsCount >= 2) {
      throw new Error('הגעת למקסימום בקשות החלפה פתוחות (2)');
    }

    // Create the swap request
    const swapRequest = await prisma.swapRequest.create({
      data: {
        shiftId,
        requestedById: userId,
        status: ShiftRequestStatus.PENDING,
        reason
      },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    // Send notifications for new swap request
    try {
      const shiftType = shift.type === 'LUNCH' ? 'צהריים' : 'ערב';
      await notificationService.notifySwapRequestCreated(
        userId,
        shift.date,
        shiftType,
        swapRequest.id
      );
    } catch (error) {
      console.error('Error sending swap request notification:', error);
    }

    return swapRequest as SwapRequestWithDetails;
  }

  /**
   * Get all available swap requests (excluding user's own requests)
   */
  async getAvailableSwapRequests(userId: string): Promise<SwapRequestWithDetails[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, position: true }
    });

    if (!user) {
      throw new Error('משתמש לא נמצא');
    }

    const requests = await prisma.swapRequest.findMany({
      where: {
        status: ShiftRequestStatus.PENDING,
        requestedById: {
          not: userId
        },
        shift: {
          date: {
            gt: new Date() // Only future shifts
          }
        }
      },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter requests where user can substitute (same level or higher, same position if SHIFT_MANAGER or BARTENDER)
    const levelOrder = {
      [EmployeeLevel.TRAINEE]: 1,
      [EmployeeLevel.RUNNER]: 2,
      [EmployeeLevel.INTERMEDIATE]: 3,
      [EmployeeLevel.EXPERT]: 4
    };

    return requests.filter(request => {
      const requesterLevel = levelOrder[request.requestedBy.level];
      const userLevel = levelOrder[user.level];

      // User must be same level or higher
      if (userLevel < requesterLevel) {
        return false;
      }

      // If requested by SHIFT_MANAGER or BARTENDER, user must have same position
      if (request.requestedBy.position === 'SHIFT_MANAGER' || request.requestedBy.position === 'BARTENDER') {
        return user.position === request.requestedBy.position;
      }

      return true;
    }) as SwapRequestWithDetails[];
  }

  /**
   * Get user's own swap requests
   */
  async getUserSwapRequests(userId: string): Promise<SwapRequestWithDetails[]> {
    const requests = await prisma.swapRequest.findMany({
      where: {
        requestedById: userId
      },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return requests as SwapRequestWithDetails[];
  }

  /**
   * Accept a swap request
   */
  async acceptSwapRequest(userId: string, swapRequestId: string): Promise<SwapRequestWithDetails> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true, position: true, fullName: true }
    });

    if (!user) {
      throw new Error('משתמש לא נמצא');
    }

    // Get the swap request with details
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    if (!swapRequest) {
      throw new Error('בקשת החלפה לא נמצאה');
    }

    if (swapRequest.status !== ShiftRequestStatus.PENDING) {
      throw new Error('בקשת החלפה אינה פעילה');
    }

    if (swapRequest.requestedById === userId) {
      throw new Error('לא ניתן לקבל את בקשת ההחלפה שלך');
    }

    // Check if shift is not too close (minimum 4 hours before)
    const now = new Date();
    const shiftDateTime = new Date(swapRequest.shift.date);
    const [hours, minutes] = swapRequest.shift.startTime.split(':').map(Number);
    shiftDateTime.setHours(hours, minutes, 0, 0);

    const minimumNotice = addHours(now, 4);
    if (shiftDateTime <= minimumNotice) {
      throw new Error('לא ניתן לקבל החלפה פחות מ-4 שעות לפני המשמרת');
    }

    // Validate business rules
    const levelOrder = {
      [EmployeeLevel.TRAINEE]: 1,
      [EmployeeLevel.RUNNER]: 2,
      [EmployeeLevel.INTERMEDIATE]: 3,
      [EmployeeLevel.EXPERT]: 4
    };

    const requesterLevel = levelOrder[swapRequest.requestedBy.level];
    const userLevel = levelOrder[user.level];

    if (userLevel < requesterLevel) {
      throw new Error('רק עובד באותה רמה או גבוהה יותר יכול לקחת את המשמרת');
    }

    // If requested by SHIFT_MANAGER or BARTENDER, user must have same position
    if (swapRequest.requestedBy.position === 'SHIFT_MANAGER' || swapRequest.requestedBy.position === 'BARTENDER') {
      if (user.position !== swapRequest.requestedBy.position) {
        throw new Error(`רק ${swapRequest.requestedBy.position === 'SHIFT_MANAGER' ? 'אחראי משמרת' : 'ברמן'} יכול לקחת את המשמרת הזו`);
      }
    }

    // Check if user is already assigned to this shift
    const isAlreadyAssigned = swapRequest.shift.employees.some(emp => emp.id === userId);
    if (isAlreadyAssigned) {
      throw new Error('אתה כבר משובץ למשמרת זו');
    }

    // Perform the swap in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update swap request status
      const updatedRequest = await tx.swapRequest.update({
        where: { id: swapRequestId },
        data: {
          status: ShiftRequestStatus.APPROVED,
          acceptedById: userId,
          resolvedAt: new Date()
        },
        include: {
          shift: {
            include: {
              employees: {
                select: {
                  id: true,
                  fullName: true,
                  level: true,
                  position: true
                }
              }
            }
          },
          requestedBy: {
            select: {
              id: true,
              fullName: true,
              level: true,
              position: true
            }
          },
          acceptedBy: {
            select: {
              id: true,
              fullName: true,
              level: true,
              position: true
            }
          }
        }
      });

      // Remove original user from shift and add new user
      await tx.shift.update({
        where: { id: swapRequest.shiftId },
        data: {
          employees: {
            disconnect: { id: swapRequest.requestedById },
            connect: { id: userId }
          }
        }
      });

      // Update shift manager if needed
      if (swapRequest.requestedBy.position === 'SHIFT_MANAGER') {
        await tx.shift.update({
          where: { id: swapRequest.shiftId },
          data: {
            shiftManagerId: userId
          }
        });
      }

      return updatedRequest;
    });

    // Send notification to the requester
    try {
      const shiftType = result.shift.type === 'LUNCH' ? 'צהריים' : 'ערב';
      await notificationService.notifySwapRequestAccepted(
        result.requestedById,
        user.fullName,
        result.shift.date,
        shiftType,
        swapRequestId
      );
    } catch (error) {
      console.error('Error sending swap accepted notification:', error);
    }

    return result as SwapRequestWithDetails;
  }

  /**
   * Cancel a swap request (only by the requester)
   */
  async cancelSwapRequest(userId: string, swapRequestId: string): Promise<SwapRequestWithDetails> {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    if (!swapRequest) {
      throw new Error('בקשת החלפה לא נמצאה');
    }

    if (swapRequest.requestedById !== userId) {
      throw new Error('ניתן לבטל רק בקשות החלפה שלך');
    }

    if (swapRequest.status !== ShiftRequestStatus.PENDING) {
      throw new Error('ניתן לבטל רק בקשות החלפה פעילות');
    }

    const updatedRequest = await prisma.swapRequest.update({
      where: { id: swapRequestId },
      data: {
        status: ShiftRequestStatus.CANCELLED,
        resolvedAt: new Date()
      },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    return updatedRequest as SwapRequestWithDetails;
  }

  /**
   * Get all swap requests (for admin)
   */
  async getAllSwapRequests(): Promise<SwapRequestWithDetails[]> {
    const requests = await prisma.swapRequest.findMany({
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return requests as SwapRequestWithDetails[];
  }

  /**
   * Get swap request by ID
   */
  async getSwapRequestById(swapRequestId: string): Promise<SwapRequestWithDetails | null> {
    const request = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    return request as SwapRequestWithDetails | null;
  }

  /**
   * Approve a swap request (Admin only)
   */
  async approveSwapRequest(adminId: string, swapRequestId: string, approvalNote?: string): Promise<SwapRequestWithDetails> {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    if (!swapRequest) {
      throw new Error('בקשת החלפה לא נמצאה');
    }

    if (swapRequest.status !== ShiftRequestStatus.PENDING) {
      throw new Error('בקשת החלפה אינה פעילה');
    }

    // Update the swap request with approval
    const result = await prisma.swapRequest.update({
      where: { id: swapRequestId },
      data: {
        status: ShiftRequestStatus.APPROVED,
        approvedById: adminId,
        approvalNote,
        approvedAt: new Date(),
        resolvedAt: new Date()
      },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    return result as SwapRequestWithDetails;
  }

  /**
   * Reject a swap request approval (Admin only)
   */
  async rejectSwapApproval(adminId: string, swapRequestId: string, approvalNote?: string): Promise<SwapRequestWithDetails> {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        }
      }
    });

    if (!swapRequest) {
      throw new Error('בקשת החלפה לא נמצאה');
    }

    if (swapRequest.status !== ShiftRequestStatus.PENDING) {
      throw new Error('בקשת החלפה אינה פעילה');
    }

    // Update the swap request with rejection
    const result = await prisma.swapRequest.update({
      where: { id: swapRequestId },
      data: {
        status: ShiftRequestStatus.REJECTED,
        approvedById: adminId,
        approvalNote,
        approvedAt: new Date(),
        resolvedAt: new Date()
      },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      }
    });

    return result as SwapRequestWithDetails;
  }

  /**
   * Get pending swap requests for admin approval
   */
  async getPendingApprovals(): Promise<SwapRequestWithDetails[]> {
    const requests = await prisma.swapRequest.findMany({
      where: {
        status: ShiftRequestStatus.PENDING,
        acceptedById: { not: null } // Only requests that have been accepted by someone
      },
      include: {
        shift: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                level: true,
                position: true
              }
            }
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return requests as SwapRequestWithDetails[];
  }
}

export const swapService = new SwapService();