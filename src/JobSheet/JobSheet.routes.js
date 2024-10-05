const express = require("express");
const { getProductType, getJobSheet, getProjectDetails, postCompanyMaster, getJobSheetDataTwoDateBetween } = require("./JobSheetCreation.controller");
const { authenticateJWT } = require("../auth/Auth.jwt");

const router = express.Router()



router.get('/getProductType/:id', getProductType)

router.get("/getJobSheet", getJobSheet)

router.get("/getProjectDetails", getProjectDetails)

router.post("/postCompanyDetails", postCompanyMaster)

router.post("/getJobSheetDataDateBetween", getJobSheetDataTwoDateBetween)

module.exports = router