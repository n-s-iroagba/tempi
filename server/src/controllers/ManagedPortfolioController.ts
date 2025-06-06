import { Request, Response } from "express";
import { ManagerService } from "../services/ManagerService.js";
import { AdminWalletService } from "../services/AdminWalletService.js";
import { CryptoWalletService } from "../services/CryptoWalletService.js";
import { InvestorService } from "../services/InvestorService.js";
import { ManagedPortfolioService } from "../services/ManagedPortfolioService.js";
import { errorHandler } from "../utils/error/errorHandler.js";
import {  CustomError } from "../utils/error/CustomError.js";
import { resolveSoa } from "dns";
import ManagedPortfolio from "../models/ManagedPortfolio.js";


type InvestmentCreationDto = {
  amount: number;
  depositMeans: string;
  managerId: string | number;
  wallet: null | {
    adminWalletId: number;
    address: string;
    currency: string;
  };
};

class ManagedPortfolioController {

static async creditAmountDeposited (req: Request, res: Response) {
  try {
    const portfolioId = req.params.portfolioId;
    const amount = req.body.amount;
    await ManagedPortfolioService.creditAmountDeposited(portfolioId, amount)
return res.status(200).json({ message: "Amount deposited successfully" });
  }catch(error) {
    errorHandler(error, req, res)
  }
}

static async creditEarnings (req: Request, res: Response) {
  try {
    const portfolioId = req.params.portfolioId;
    const amount = req.body.amount;
    await ManagedPortfolioService.creditEarnings(portfolioId, amount)
    return res.status(200).json({ message: "Earnings credited successfully" });
  }catch(error) {
    errorHandler(error, req, res)
  }
}
  
  static async createInvestment(req: Request, res: Response) {
    try {
      const investorId = Number(req.params.investorId);
      console.log(req.body)
      const { amount, depositMeans, managerId, wallet }: InvestmentCreationDto = req.body;
      const preexistingPortfolio= await ManagedPortfolio.findOne({where:{investorId}})
      if (preexistingPortfolio) {
        if (!preexistingPortfolio.amountDeposited){
          preexistingPortfolio.destroy()
        }else{
          if(preexistingPortfolio.amountDeposited<amount){
            preexistingPortfolio.managerId = Number(managerId)
          }
          preexistingPortfolio.amount+=amount
          preexistingPortfolio.save()
        return res.status(201).json({ newInvestmentId: preexistingPortfolio.id });

        }
      }
      // Basic validation
      if (!amount || typeof amount !== "number") {
        throw new CustomError(400, "Missing or invalid 'amount'");
      }

      if (!depositMeans || typeof depositMeans !== "string") {
        throw new CustomError(400, "Missing or invalid 'depositMeans'");
      }

      if (!managerId || (typeof managerId !== "number" && typeof managerId !== "string")) {
        throw new CustomError(400, "Missing or invalid 'managerId'");
      }

      if (depositMeans === "CRYPTO") {
        if (!wallet) {
          throw new CustomError(400, "Missing 'wallet' details for CRYPTO deposit");
        }

        const { adminWalletId, address, currency } = wallet;

        if (!adminWalletId || !address || !currency) {
          throw new CustomError(400, "Incomplete 'wallet' information: 'adminWalletId', 'address', and 'currency' are required");
        }
      }

      const manager = await ManagerService.getManagerById(Number(managerId));
      const portfolio = await ManagedPortfolioService.createPortfolio({
        managerId: manager.id,
        amount,
        investorId,
      });

      if (depositMeans === "CRYPTO" && wallet) {
        const adminWallet = await AdminWalletService.getAdminWalletById(wallet.adminWalletId);
        await CryptoWalletService.createCryptoWallet(wallet.currency, wallet.address, adminWallet.address, portfolio.id);
      }

      return res.status(201).json({ newInvestmentId: portfolio.id });
    } catch (error) {
      errorHandler(error, req, res);
    }
  }
   static async getInvestment(req:Request, res:Response){
    try {
      const investorId = Number(req.params.investorId); 
      const  portfolio = await ManagedPortfolioService.getInvestmentByInvestorId(investorId)
      return res.status(200).json(portfolio)
    }catch(error){
      errorHandler(error, req, res);
    }
   }

}

export default ManagedPortfolioController;
