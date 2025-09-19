export enum SwapRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface SwapRequest {
  id: string;
  shiftId: string;
  requestedById: string;
  acceptedById?: string | null;
  approvedById?: string | null;
  approvalNote?: string | null;
  approvedAt?: Date | null;
  status: SwapRequestStatus;
  reason?: string | null;
  createdAt: Date;
  resolvedAt?: Date | null;
}

export interface CreateSwapRequestDto {
  shiftId: string;
  reason?: string;
}

export interface AcceptSwapRequestDto {
  swapRequestId: string;
  acceptedById: string;
}

export interface RejectSwapRequestDto {
  swapRequestId: string;
}

export interface ApproveSwapRequestDto {
  swapRequestId: string;
  approvalNote?: string;
}

export interface RejectSwapApprovalDto {
  swapRequestId: string;
  approvalNote?: string;
}