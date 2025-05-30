import { Payment } from "./Payment";



export type VerificationFee ={
    id:number
     amount: number;
 isPaid?: boolean;
 name:string;
 payments: Payment[]
}

export type VerificationFeeCreationDto = {

      amount: number;

  name:string
}
export type UploadVerificationFeeProofOfPaymentDto={
    receipt:File
    paymentId:string
    paymentType:string
}
export type ApproveVerificationFee ={
    isPaid:boolean
}


export interface VerificationFeeItem {
  id: number;
  name: string;
  amount: number;
  isPaid: boolean;
  investorId: number;
  investorName: string;
  createdAt: Date;
  updatedAt: Date;
}