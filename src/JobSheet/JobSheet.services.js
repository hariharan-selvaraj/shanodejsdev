const model = require('../database/model');
const sql = require('mssql');
const moment = require('moment');
const { sendPushNotification } = require('../PushNotification/PushNotifiy');


// const { postCompanyMaster } = require('./JobSheetCreation.controller');

//[dbo].[MB_Jobsheet] insert Logic
const postCompanyMasterInsertFunction = async (CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload, user_id, createdDate, request, callback) => {

  let postquery = `insert into MB_Jobsheet (CompanyType,ProjectTypeId,PhotoTypeId,JobId,ProjectName,Location,ImageUpload,CreatedBy,createdDate,EntryTime) values (
    @CompanyType, @projectTypeIdValue, @photoTypeIdvalue, @jobIdvalue, @ProjectName, @Location, @ImageUpload,@CreatedBy,@createdDateValue,@EntryTimeValue)`;

  request
    .input('CompanyType', sql.VarChar(50), CompanyType)
    .input('projectTypeIdValue', sql.Int, ProjectType)
    .input('photoTypeIdvalue', sql.Int, PhotoType)
    .input('jobIdvalue', sql.Int, Job)
    .input('ProjectName', sql.Int, ProjectName)
    .input('Location', sql.VarChar(50), Location)
    .input('ImageUpload', sql.VarChar(50), ImageUpload)
    .input("CreatedBy", sql.Int, user_id)
    .input("createdDateValue", moment().format('YYYY-MM-DD HH:mm:ss'))
    .input("EntryTimeValue", createdDate)


  const response = await request.query(postquery);
  const DetailedResponse = await userResponseDetails(ProjectType, user_id, PhotoType, Location, request)
  console.log("DetailedResponse", DetailedResponse)
  await sendPushNotification(DetailedResponse, (err, result) => {
    if (err) {
      console.log("Push notification error:", err)
    }
    else if (result === "FCM Token Not Found") {
      console.log("FCM TOKEN NOT FOUND")
    } else {
      console.log("Notification sent successfully", result);
    }

  })

  return callback(null, response.rowsAffected[0]);
}

//Gathering Notification Related Data's from DB
const userResponseDetails = async (ProjectType, user_id, PhotoType, Location, request) => {
  console.log("ProjectType", ProjectType)
  console.log("user_id", user_id)
  console.log("PhotoType", PhotoType)
  console.log("Location", Location)
  const result = {}

  let projectTypeQuery = `select ProjectType from ProjectTypeMaster where ProjectTypeId = @ProjectTypeValue`;
  request
    .input('ProjectTypeValue', sql.Int, ProjectType)
  const projectTypeResponse = await request.query(projectTypeQuery)

  let photoTypeQuery = `select PhotoType from PhotoTypeID where PhotoTypeId = @PhotoTypeValue`
  request.input("PhotoTypeValue", sql.Int, PhotoType)
  const photoTypeResponse = await request.query(photoTypeQuery)

  let userIdQuery = `select UserName from UserMasterDetail where Userid = @user_idValue`
  request.input("user_idValue", sql.Int, user_id)
  const userIdResponse = await request.query(userIdQuery)

  result.projectType = projectTypeResponse.recordset[0].ProjectType
  result.PhotoType = photoTypeResponse.recordset[0].PhotoType
  result.userName = userIdResponse.recordset[0].UserName
  result.Location = Location
  result.userId = user_id
  return result
}


module.exports = {
  getSelectedProductTypeMaster: async (data, callback) => {
    // const id = data.id;  
    const id = Number(data.id)
    try {
      const request = model.db.request();
      let query = `SELECT ProjectTypeId , ProjectType FROM ProjectTypeMaster tm
          WHERE`;
      if (id === 2) {
        query += ` tm.Id = @id`
      } else {
        query += ` tm.Id not in(2)`
      }
      request.input('id', sql.Int, id);
      const response = await request.query(query);
      return callback(null, response.recordset);
    } catch (err) {
      return callback(err)
    }
  },

  getJobSheet: async (callback) => {

    try {
      const request = model.db.request();
      let query = `SELECT JobSheetMasterId ,JobSheetId, Location FROM JobSheetMaster`;
      const response = await request.query(query);
      return callback(null, response.recordset);
    } catch (err) {
      return callback(err)
    }
  },

  getProjectDetails: async (callback) => {
    try {
      const request = model.db.request();
      let query = `SELECT ProjectId ,ProjectName, ProjectLocation FROM ProjectDetails`;
      const response = await request.query(query);
      return callback(null, response.recordset);
    } catch (err) {
      return callback(err)
    }
  },

  postCompanyMaster: async (data, callback) => {
    try {
      const { CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload, user_id } = data

      const request = model.db.request();

      const createdDate = moment(ImageUpload[0].dateTime).utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss');

      let query = `Select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where CreatedBy = @user_id And CONVERT(DATE, EntryTime) = @createdDate order by Id`

      request
        .input("user_id", user_id)
        .input("createdDate", createdDate.split(" ")[0])
      const firstCheckResponse = await request.query(query);

      if (firstCheckResponse.recordset.length > 0) {
        const recordSetLength = firstCheckResponse.recordset.length
        const lastrecard = firstCheckResponse.recordset[recordSetLength - 1]
        console.log("lastrecard", lastrecard)

        if (lastrecard.ProjectTypeId === ProjectType) {

          if (lastrecard.PhotoTypeId === 1 && PhotoType === 1) {
            const dateObject = new Date(createdDate.replace(' ', 'T'));
            console.log("dateObject", dateObject)
            const currentHour = dateObject.getHours();

            //user enterstarttime after 8pm
            if (currentHour >= 20) {
              return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
            } else {
              return callback(null, "Record exists");
            }
          }

          if (lastrecard.PhotoTypeId === 2 && PhotoType === 1) {

            return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
          }

          if (lastrecard.PhotoTypeId === 2 && PhotoType === 3) {
            return callback(null, "give startTime")
          }

          if (lastrecard.PhotoTypeId === 3 && PhotoType === 2) {

            return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
          }

          if (lastrecard.PhotoTypeId === 3 && PhotoType === 1) {
            return callback(null, "Record exists")
          }

          if (lastrecard.PhotoTypeId === 3 && PhotoType === 3) {

            return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
          }

          if (lastrecard.PhotoTypeId === 2 && PhotoType === 2) {
            return callback(null, "give startTime")
          }

          if (lastrecard.PhotoTypeId === 1 && PhotoType === 3) {
            postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
          }
          if (lastrecard.PhotoTypeId === 1 && PhotoType === 2) {
            postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
          }

        } else {
          if (lastrecard.PhotoTypeId === 2) {
            if (PhotoType === 1) {
              postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
            } else {
              return callback(null, "give startTime")
            }

          } else {
            return callback(null, "Enter Different ProjectName")
          }
        }



      } else {
        if (PhotoType === 2 || PhotoType === 3) {
          return callback(null, "give startTime")
        } else {
          postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }
      }

    } catch (err) {
      console.log(err)
      return callback(err)
    }
  },

  getJobSheetDataDateBetween: async (req, callback) => {
    try {
      const { startdate, enddate } = req.body

      if (!startdate || !enddate) {
        return callback(null, "Enter Dates")
      }
      const request = model.db.request();

      let query = `SELECT  MBJ.Id,MBJ.CompanyType ,PTM.ProjectType,PTI.PhotoType,JSM.JobSheetId,PD.ProjectName,MBJ.Location,CONCAT('images/',  REPLACE(MBJ.ImageUpload, 'uploads\\', '')) AS ImageUpload,MBJ.IsActive,UMD.UserName,MBJ.CreatedDate,MBJ.ModifiedBy,MBJ.ModifiedDate,MBJ.EntryTime FROM MB_Jobsheet MBJ
      LEFT JOIN ProjectTypeMaster PTM ON MBJ.ProjectTypeId = PTM.ProjectTypeId
      LEFT JOIN PhotoTypeID PTI ON MBJ.PhotoTypeId = PTI.PhotoTypeId
      LEFT JOIN JobSheetMaster JSM ON MBJ.JobId = JSM.JobSheetMasterId
      LEFT JOIN ProjectDetails PD ON MBJ.ProjectName = PD.ProjectId
      LEFT JOIN UserMasterDetail UMD ON MBJ.CreatedBy = UMD.Userid
      WHERE CONVERT(DATE, MBJ.EntryTime) BETWEEN @startdate AND @enddate ORDER BY MBJ.Id`

      request
        .input("startdate", startdate)
        .input("enddate", enddate)

      const dateBetWeenDatas = await request.query(query)
      // console.log("dateBetWeenDatas", dateBetWeenDatas.recordset)
      if (dateBetWeenDatas.recordset.length === 0) {
        return callback(null, dateBetWeenDatas.recordset)
      }

      return callback(null, dateBetWeenDatas.recordset)
    } catch (err) {
      console.log(err)
      return callback(err)
    }
  }


  // postCompanyMaster: async (data, callback) => {
  //   // console.log("data", data)
  //   const { CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload, user_id } = data
  //   try {

  //     const request = model.db.request();

  //     const createdDate = moment(ImageUpload[0].dateTime).utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss');

  //     let query = `Select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where CreatedBy = @user_id And CONVERT(DATE, EntryTime) = @createdDate`

  //     request
  //       .input("user_id", sql.Int, user_id)
  //       .input("createdDate", createdDate.split(" ")[0])
  //     const firstCheckResponse = await request.query(query);

  //     if (firstCheckResponse.recordset.length > 0) {
  //       const recordSetLength = firstCheckResponse.recordset.length
  //       const firstRecord = firstCheckResponse.recordset[0];
  //       const lastRecord = firstCheckResponse.recordset[recordSetLength - 1];

  //       //user already enter starttime give endtime && location Change
  //       if (firstRecord.PhotoTypeId === 1 && PhotoType === 2 || firstRecord.PhotoTypeId === 1 && PhotoType === 3) {

  //         // user lastrecord companyType not give starttime enter location change or end Time
  //         /* if (lastRecord.CompanyType !== CompanyType  && lastRecord.ProjectTypeId !== ProjectType && PhotoType !== 1) {
  //           return callback(null, "Enter Different ProjectName")
  //         } */

  //         /*  if ( lastRecord.CompanyType !== CompanyType &&  lastRecord.ProjectTypeId !== ProjectType) {
  //            return callback(null, "Enter Different ProjectName")
  //          } */

  //         if (/* lastRecord.CompanyType !== CompanyType  &&*/ lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoType !== 1) {
  //           return callback(null, "give startTime")
  //         }


  //         //user enter again endtime
  //         if (lastRecord.PhotoTypeId === 2 && PhotoType === 2) {
  //           return callback(null, "give startTime")
  //         }
  //         //user enter location change not give starttime
  //         if (lastRecord.PhotoTypeId === 2 && PhotoType === 3) {
  //           return callback(null, "give startTime")
  //         }


  //         return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)

  //       }

  //       else if (/* lastRecord.CompanyType !== CompanyType &&  */lastRecord.ProjectTypeId !== ProjectType && PhotoType === 1) {
  //         return callback(null, "Enter Different ProjectName")
  //       }

  //       // user enter endTime again enter start Time
  //       else if (lastRecord.PhotoTypeId === 2 && PhotoType === 1 && ProjectType === 1) {

  //         if (/* lastRecord.CompanyType !== CompanyType &&  */lastRecord.ProjectTypeId !== ProjectType && PhotoType === 1) {
  //           return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //         } else {
  //           return callback(null, "Enter Different ProjectName")
  //         }
  //       }


  //       // user already give starttime again enter starttime
  //       else if (firstRecord.PhotoTypeId === 1 && PhotoType === 1) {
  //         const dateObject = new Date(createdDate.replace(' ', 'T'));
  //         console.log("dateObject", dateObject)
  //         const currentHour = dateObject.getHours();

  //         //user enterstarttime after 8pm
  //         if (currentHour >= 20) {
  //           return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //         } else {
  //           return callback(null, "Record exists");
  //         }
  //       }

  //     }
  //     else {

  //       if (PhotoType === 2 || PhotoType === 3) {
  //         return callback(null, "give startTime");
  //       }
  //       //insert firsttime that user record not found in db
  //       postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //     }

  //   } catch (err) {
  //     return callback(err)
  //   }
  // } 

  /*  postCompanyMaster2: async (data, callback) => {
     // console.log("data", data)
     const { CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload, user_id } = data
     try {
       const request = model.db.request();
 
       const createdDate = moment(ImageUpload[0].dateTime).utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss');
 
       let query = `Select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where CreatedBy = @user_id And CONVERT(DATE, EntryTime) = @createdDate`
 
       request
         .input("user_id", user_id)
         .input("createdDate", createdDate.split(" ")[0])
 
       const firstCheckResponse = await request.query(query);
       // console.log("firstCheckResponse.recordset[0]", firstCheckResponse.recordset)
       if (firstCheckResponse.recordset.length > 0) {
 
         const recordSetLength = firstCheckResponse.recordset.length
         const firstRecord = firstCheckResponse.recordset[0];
         const lastRecord = firstCheckResponse.recordset[recordSetLength - 1];
 
         // console.log("lastRecord", lastRecord)
 
         let query = `select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where ProjectTypeId = @ProjectType And PhotoTypeId IN (1, 2 , 3)`
 
         request
           .input("ProjectType", ProjectType)
         const response = await request.query(query)
         // console.log("response.recordset[0]", response.recordset)
         if (response.recordset.length > 0) {
 
           const recordSetLength = response.recordset.length
           // console.log(response.recordset[0])
           const lastRecord = response.recordset[recordSetLength - 1];
           // console.log("lastRecord", lastRecord)
 
 
 
           console.log(lastRecord)
           if (lastRecord.PhotoTypeId === 1 && PhotoType === 2 || lastRecord.PhotoTypeId === 1 && PhotoType === 3) {
             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
           }
 
           if (lastRecord.PhotoTypeId === 1 && PhotoType === 1) {
             const dateObject = new Date(createdDate.replace(' ', 'T'));
             console.log("dateObject", dateObject)
             const currentHour = dateObject.getHours();
 
             //user enterstarttime after 8pm
             if (currentHour >= 20) {
               return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
             } else {
               return callback(null, "Record exists");
             }
           }
 
           if (lastRecord.PhotoTypeId === 2 && PhotoType === 1) {
 
             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
           }
 
           if (lastRecord.PhotoTypeId === 2 && PhotoType === 3) {
             return callback(null, "give startTime")
           }
 
           if (lastRecord.PhotoTypeId === 3 && PhotoType === 2) {
 
             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
           }
 
           if (lastRecord.PhotoTypeId === 3 && PhotoType === 1) {
             return callback(null, "Record exists")
           }
 
           if (lastRecord.PhotoTypeId === 3 && PhotoType === 3) {
 
             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
           }
 
           if (lastRecord.PhotoTypeId === 2 && PhotoType === 2) {
             return callback(null, "give startTime")
           }
 
         }
 
         else {
         
           console.log("hiii")
           console.log(lastRecord)
           if (lastRecord.PhotoTypeId !== 2) {
             return callback(null, "Enter Different ProjectName")
           }
           if (lastRecord.PhotoTypeId === 2 && PhotoType === 1) {
             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
           }
 
           if (lastRecord.PhotoTypeId === 2 && PhotoType !== 1) {
             return callback(null, "give startTime")
           }
           if (lastRecord.PhotoTypeId === 1) {
             console.log("hello")
             return callback(null, "Enter Different ProjectName")
           }
 
         }
 
       }
 
 
 
       else {
         if (PhotoType === 2 || PhotoType === 3) {
           return callback(null, "give startTime")
         } else {
           postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
         }
       }
     } catch (err) {
       return callback(err)
     }
   }, */

  // postCompanyMaster: async (data, callback) => {
  //   const { CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload, user_id } = data
  //   try {
  //     const request = model.db.request();

  //     const createdDate = moment(ImageUpload[0].dateTime).utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss');

  //     let query = `Select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where CreatedBy = @user_id And CONVERT(DATE, EntryTime) = @createdDate`

  //     request
  //       .input("user_id", user_id)
  //       .input("createdDate", createdDate.split(" ")[0])

  //     const firstCheckResponse = await request.query(query);
  //     if (firstCheckResponse.recordset.length > 0) {

  //       let query = `select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where ProjectTypeId = @ProjectType`

  //       request
  //         .input("ProjectType", ProjectType)
  //       const response = await request.query(query)
  //       console.log("response.recordset[0]", response.recordset)
  //       if (response.recordset.length > 0) {
  //         const length = response.recordset.length
  //         const lastRecord = response.recordset[length - 1]
  //         console.log(lastRecord)
  //         if (lastRecord.PhotoTypeId === 1 && PhotoType === 1) {
  //           const dateObject = new Date(createdDate.replace(' ', 'T'));
  //           console.log("dateObject", dateObject)
  //           const currentHour = dateObject.getHours();

  //           //user enterstarttime after 8pm
  //           if (currentHour >= 20) {
  //             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //           } else {
  //             return callback(null, "Record exists");
  //           }
  //         }

  //         else if (lastRecord.PhotoTypeId === 1 && PhotoType === 2 || lastRecord.PhotoTypeId === 1 && PhotoType === 3) {
  //           console.log("hiii2")
  //           return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //         }

  //         else if (lastRecord.PhotoTypeId === 2 && PhotoType === 2 || lastRecord.PhotoTypeId === 2 && PhotoType === 3) {
  //           console.log("hiii")
  //           return callback(null, "give startTime")
  //         }
  //         else if (lastRecord.PhotoTypeId === 2 && PhotoType === 1) {
  //           return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //         }
  //         else if (lastRecord.PhotoTypeId === 3 && PhotoType === 2 || lastRecord.PhotoTypeId === 3 && PhotoType === 3) {
  //           return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //         }


  //       }
  //       else {
  //         let lastrecard = `Select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where ProjectTypeId = @ProjectTypevalue And PhotoTypeId = 1`
  //         request
  //           .input("ProjectTypevalue", ProjectType)


  //         const firstCheckResponse = await request.query(lastrecard);
  //         if (firstCheckResponse.recordset.length > 0) {
  //           const length = firstCheckResponse.recordset.length
  //           const lastrecard = firstCheckResponse.recordset[length - 1]
  //           if (lastrecard.PhotoTypeId === 2 && PhotoType === 1) {
  //             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //           }
  //           else if (lastrecard.PhotoTypeId === 1 && PhotoType === 1) {
  //             return callback(null, "Enter Different ProjectName")
  //           }

  //         } else {

  //           if (PhotoType === 1) {
  //             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //           }
  //           else if (lastrecard.PhotoTypeId === 1 && PhotoType === 1) {
  //             return callback(null, "Enter Different ProjectName")
  //           }
  //         }

  //         /* 
  //                   let query = `SELECT 
  //                    COUNT(CASE WHEN ProjectTypeId = 1 THEN 1 END) AS CountType1,
  //                    COUNT(CASE WHEN ProjectTypeId = 2 THEN 1 END) AS CountType2,
  //                    COUNT(CASE WHEN ProjectTypeId = 3 THEN 1 END) AS CountType3
  //                    FROM MB_Jobsheet;`

  //                   const response = await request.query(query)
  //                   console.log(response.recordset)

  //                   if (response.recordset[0].CountType1 === 0) {
  //                     if (ProjectType === 1 && PhotoType === 1) {
  //                       return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //                     }
  //                     return callback(null, "Enter Different ProjectName")
  //                   }


  //                   else if (response.recordset[0].CountType2 === 0) {
  //                     console.log("hihihi")
  //                     if (ProjectType === 2 && PhotoType === 1) {
  //                       return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //                     } else {

  //                       return callback(null, "Enter Different ProjectName")
  //                     }
  //                   }

  //                   else if (response.recordset[0].CountType3 === 0) {
  //                     console.log("jogpjoj")
  //                     if (ProjectType === 3 && PhotoType === 1) {
  //                       return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //                     }
  //                     return callback(null, "Enter Different ProjectName")
  //                   }


  //          */


  //         /*   if (PhotoType === 1) {
  //             return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //           }
  //             else if (lastRecord.PhotoTypeId === 1 && lastRecord.ProjectTypeId !== ProjectType && PhotoType === 1) {
  //           return callback(null, "Enter Different ProjectName")
  //         }
  //          */

  //       }


  //     } else {


  //       if (PhotoType === 2 || PhotoType === 3) {
  //         return callback(null, "give startTime")
  //       } else {
  //         postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
  //       }
  //     }
  //   } catch (err) {
  //     console.log(err)
  //     callback(err)
  //   }
  // }
  /* postCompanyMaster1: async (data, callback) => {
    const { CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload, user_id } = data
    try {
      const request = model.db.request();

      const createdDate = moment(ImageUpload[0].dateTime).utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss');

      let query = `Select CreatedBy,EntryTime ,ProjectTypeId,CompanyType,PhotoTypeId from MB_Jobsheet where CreatedBy = @user_id And CONVERT(DATE, EntryTime) = @createdDate`

      request
        .input("user_id", user_id)
        .input("createdDate", createdDate.split(" ")[0])

      const firstCheckResponse = await request.query(query);
      // console.log("firstCheckResponse.recordset[0]", firstCheckResponse.recordset)
      if (firstCheckResponse.recordset.length > 0) {
        console.log("1")
        const recordSetLength = firstCheckResponse.recordset.length
        const firstRecord = firstCheckResponse.recordset[0];
        const lastRecord = firstCheckResponse.recordset[recordSetLength - 1];

        if (lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoTypeId === 2 && PhotoType === 1) {
          console.log("2")
          return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }
        if (lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoTypeId === 1 && PhotoType === 1) {
          console.log("3")
          return callback(null, "Enter Different ProjectName")
        }
        if (lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoTypeId === 2 && PhotoType === 2) {
          console.log("4")
          return callback(null, "Enter Different ProjectName")
        }
        if (lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoTypeId === 2 && PhotoType === 3) {
          console.log("19")
          return callback(null, "Enter Different ProjectName")
        }
        if (lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoTypeId === 3 && PhotoType === 3) {
          console.log("5")
          return callback(null, "Enter Different ProjectName")
        }
        if (lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoTypeId === 3 && PhotoType === 1) {
          console.log("17")
          return callback(null, "Enter Different ProjectName")
        }
        if (lastRecord.ProjectTypeId !== ProjectType && lastRecord.PhotoTypeId === 3 && PhotoType === 2) {
          console.log("18")
          return callback(null, "Enter Different ProjectName")
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 1 && PhotoType === 1) {
          console.log("6")
          const dateObject = new Date(createdDate.replace(' ', 'T'));
          console.log("dateObject", dateObject)
          const currentHour = dateObject.getHours();

          //user enterstarttime after 8pm
          if (currentHour >= 20) {
            console.log("7")
            return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
          } else {
            console.log("8else")
            return callback(null, "Record exists");
          }
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 1 && PhotoType === 3) {
          console.log("9")
          return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }

        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 2 && PhotoType === 1) {
          console.log("10")
          return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 3 && PhotoType === 3) {
          console.log("11")
          return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 3 && PhotoType === 2) {
          console.log("12")
          return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 2 && PhotoType === 2) {
          console.log("13")
          return callback(null, "give startTime")
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 2 && PhotoType === 3) {
          console.log("14")
          return callback(null, "give startTime")
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 1 && PhotoType === 2) {
          console.log("15")
          return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }
        if (lastRecord.ProjectTypeId === ProjectType && lastRecord.PhotoTypeId === 3 && PhotoType === 1) {
          console.log("16")
          const dateObject = new Date(createdDate.replace(' ', 'T'));
          console.log("dateObject", dateObject)
          const currentHour = dateObject.getHours();
          //user enterstarttime after 8pm
          if (currentHour >= 20) {
            return postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
          } else {
            return callback(null, "Record exists");
          }
        }
      } else {
        if (PhotoType === 2 || PhotoType === 3) {
          console.log("15")
          return callback(null, "give startTime")
        } else {
          console.log("16else")
          postCompanyMasterInsertFunction(CompanyType, ProjectType, PhotoType, Job, ProjectName, Location, ImageUpload[0].path, user_id, createdDate, request, callback)
        }
      }

    } catch (err) {
      console.log(err)
      return callback(err)
    }
  }, */


}
