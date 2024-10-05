const { getSelectedProductTypeMaster, getJobSheet, getProjectDetails, postCompanyMaster, getJobSheetDataDateBetween } = require("./JobSheet.services")


module.exports = {
    getProductType: (req, res) => {
        // const body = req.body
        const params = req.params
        getSelectedProductTypeMaster(params, (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: 0,
                    message: "Internal Server Error",
                    err: err
                })
            }
            return res.status(200).json({
                success: 1,
                data: result
            })
        })
    },

    getJobSheet: (req, res) => {
        getJobSheet((err, result) => {
            if (err) {
                return res.status(500).json({
                    success: 0,
                    message: "Internal Server Error",
                    err: err
                })
            }
            return res.status(200).json({
                success: 1,
                data: result
            })
        })
    },

    getProjectDetails: (req, res) => {
        getProjectDetails((err, result) => {
            if (err) {
                return res.status(500).json({
                    success: 0,
                    message: "Internal Server Error",
                    err: err
                })
            }
            return res.status(200).json({
                success: 1,
                data: result
            })
        })
    },

    postCompanyMaster: (req, res) => {
        const data = req.body
        postCompanyMaster(data, (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: 0,
                    message: "Internal Server Error",
                    err: err
                })
            }

            else if (result == "Record exists") {
                return res.status(409).json({
                    success: 0,
                    message: "Already you enter start time"
                })
            }
            else if (result == "give startTime") {
                return res.status(403).json({
                    success: 0,
                    message: "Plese give start Time"
                })
            }

            else if (result == "Enter Different ProjectName") {
                return res.status(403).json({
                    success: 0,
                    message: "Plese select the valid project name"
                })
            }

            else if (result === 1) {
                return res.status(200).json({
                    success: 1,
                    message: "Post SuccessFully",

                })
            }

        })
    },

    getJobSheetDataTwoDateBetween: (req, res) => {
        // const body = req.body
        getJobSheetDataDateBetween(req, (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: 0,
                    message: "Internal Server Error",
                    err: err
                })
            }
            if (result === "Enter Dates") {
                return res.status(404).json({
                    success: 0,
                    message: "You Must Enter StartDate And EndDate"
                })
            }
            if (result === "userNotFound") {
                return res.status(404).json({
                    success: 0,
                    message: "User Not Found"
                })
            }
            return res.status(200).json({
                success: 1,
                data: result
            })
        })
    }
}