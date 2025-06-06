import { Response, Router } from "express"
import { AuthController } from "./controllers/AuthController.js"
import ManagerController from "./controllers/ManagerController.js"
import AdminWalletController from "./controllers/AdminWalletController.js"
import { upload } from "./middlewares/upload.js"
import EmailController from "./controllers/EmailController.js"

import KycController from "./controllers/KycController.js"
import SocialMediaController from "./controllers/SocialMediaController.js"
import ManagedPortfolioController from "./controllers/ManagedPortfolioController.js"
import { VerificationFeeController } from "./controllers/VerificationFeeController.js"
import InvestorController from "./controllers/InvestorController.js"
import { authenticate, type AuthenticatedRequest } from "./middlewares/authenticate.js"
import Investor from "./models/Investor.js"
import Admin from "./models/Admin.js"
import { CustomError } from "./utils/error/CustomError.js"
import { errorHandler } from "./utils/error/errorHandler.js"
import { PaymentController } from "./controllers/PaymentController.js"
import User from "./models/User.js"
import ReferralController from "./controllers/ReferralController.js"
const router = Router()
router.post("/investment/new/:investorId", ManagedPortfolioController.createInvestment)
router.get("/managed-portfolios/investor/:investorId", ManagedPortfolioController.getInvestment)
router.patch('/managed-portfolios/credit-amount-deposited/:portfolioId', ManagedPortfolioController.creditAmountDeposited)
router.patch('/managed-portfolios/credit-earnings/:portfolioId', ManagedPortfolioController.creditEarnings)

router.get('/investors', InvestorController.getAllInvestors)

router.get('/get-investor/:investorId', InvestorController.getInvestor)

router.delete("/investors/:id", InvestorController.deleteInvestor)

router.get('/investors/:investorId/referrals',ReferralController.getInvestorReferrals)
router.get('/investors/:investorId/referrals/settled',ReferralController.getInvestorSettledReferrals)
router.get('/investors/:investorId/referrals/unsettled', ReferralController.getInvestorUnsettledReferrals)

// New investor profile routes
router.get("/investors/me/:investorId",  InvestorController.getMyProfile)
router.patch("/investors/me/:investorId", authenticate, InvestorController.updateMyProfile)

router.post("/kyc/:investorId", KycController.create)
router.patch("/kyc/:id", KycController.update)
router.get("/kyc/verify/:id", KycController.verify)
router.get('/kyc/unverified',KycController.getUnverified)

router.get("/managers", ManagerController.getAllManagers)
router.get("/managers/:id", ManagerController.getManagerById)
router.post("/managers", 
  upload.single("image"), 
  ManagerController.createManager)
router.patch("/managers/:id", upload.single("image"), ManagerController.updateManager)
router.delete("/managers/:id", ManagerController.deleteManager)

// Admin Wallet routes
router.get("/admin-wallets", AdminWalletController.getAllAdminWallets)
router.get("/admin-wallets/:id", AdminWalletController.getAdminWalletById)
router.post("/admin-wallets", AdminWalletController.createAdminWallet)
router.patch("/admin-wallets/:id", AdminWalletController.updateAdminWallet)
router.delete("/admin-wallets/:id", AdminWalletController.deleteAdminWallet)

router.get('/referrals/unpaid', ReferralController.getUnpaidReferrals)
// Social Media routes
router.get("/social-media", SocialMediaController.getAll)
router.get("/social-media/:id", SocialMediaController.getById)
router.post("/social-media", upload.single("logo"), SocialMediaController.create)
router.patch("/social-media/:id", upload.single("logo"), SocialMediaController.update)
router.delete("/social-media/:id", SocialMediaController.delete)

// Verification Fees routes

router.post("/verification-fees/:investorId", VerificationFeeController.create)
router.patch("/verification-fees/:id", VerificationFeeController.update)
router.delete("/verification-fees/:id", VerificationFeeController.delete)
router.get('/verification-fees/unpaid/:investorId',VerificationFeeController.getUnpaidVerificationFees)



router.post("/create/:investorId",upload.single('file'), PaymentController.createPayment)

// Update a payment
router.put("/payments/:id", PaymentController.updatePayment)

// Verify a payment
router.patch("/payments/verify/:id", PaymentController.verifyPayment)

// Unverify a payment
router.patch("/payments/unverify/:id", PaymentController.unverifyPayment)

// Get all unverified payments
router.get("/payments/unverified", PaymentController.getUnverifiedPayments)

// Get all payments for a specific investor
router.get("/payments/investor/:investorId", PaymentController.getPaymentsByInvestorId)

// Get investor payments (alternate route)
router.get("/investor-payments/:id", PaymentController.getInvestorPayments)

// Delete a payment
router.delete("/:id", PaymentController.deletePayment)
// Auth routes
router.post("/auth/forgot-password", AuthController.forgotPassword)
router.post("/auth/reset-password", AuthController.resetPassword)
router.post("/auth/login", AuthController.login)
router.post("/auth/signup", AuthController.investorSignup)
router.post("/auth/admin/signup", AuthController.adminSignup)
router.post("/auth/verify-email", AuthController.verifyEmail)
router.post(`/auth/resend-verification-token`, AuthController.resendVerificationToken)
router.get("/auth/logout", (req, res) => {
  
  res.clearCookie("token")
  return res.status(200).json({ message: "Logged out successfully" })
})

// Email routes
router.post("/email/send", EmailController.sendGeneralEmail)
router.post("/email/send-to-investor/:investorId", EmailController.sendEmailToInvestor)

async function getInvestorById(id: string): Promise<Investor | null> {
  // Replace with real DB query
  return await Investor.findByPk(id)
}

async function getAdminById(id: string): Promise<Admin | null> {
  // Replace with real DB query
  return await Admin.findByPk(id)
}

router.get("/auth/me", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, role } = req.user!
  console.log('id', userId)
 type LoggedInUser ={
  displayName:string
  isAdmin:boolean
  roleId:number
}
  try {
    if (role === "INVESTOR") {
     
      const investor = await Investor.findOne({where:{userId}})
      if (!investor) throw new CustomError(404, "Investor not found")

      const user:LoggedInUser = {
          displayName:investor.firstName,
          isAdmin:false,
          roleId:investor.id
      }
      return res.json(user)
    }

    if (role === "ADMIN") {
     
      const admin = await Admin.findOne({where:{userId}})
    
      if (!admin) throw new CustomError(404, "Admin not found")

      const user:LoggedInUser = {
         displayName:admin.username,
         isAdmin:true,
         roleId:admin.id
      }

      return res.json(user)
    }

    throw new CustomError(404,'unknown user')
  } catch (err) {
    console.error(err)
    errorHandler(err, req, res)
  }
  })

router.post("/auth/refresh-token" /* authController.refreshToken */)

export default router
