const express = require("express");
const sprintRouter = express.Router();

const { taskModel } = require("../models/taskModel");
const { sprintModel } = require("../models/sprintModel");

//create a new sprint
sprintRouter.post("/create", async (req, res) => {
  const { sprintName, creatorId } = req.body;
  const sprintNameExists = await sprintModel.findOne({
    $and: [{ sprintName: sprintName }, { creatorId: creatorId }],
  });
  try {
    if (sprintName && creatorId) {
      //if sprintName is Exists in our database for same user then he can not use same name,need to change it.
      if (sprintNameExists) {
        return res.send({
          message: "Already Sprint Exists Please Choose Another Name",
        });
      }
      // if sprintName is not Exists in our database for same user then he can create.
      const newSprint = new sprintModel({
        sprintName,
        creatorId,
      });

      await newSprint.save();

      res.send({
        message: "new sprint created successfully",
      });
    }
  } catch (error) {
    res.send({
      message: "Server error while connecting to backend",
    });
  }
});

// --> get All sprint name by creatorId
sprintRouter.get("/:creatorId", async (req, res) => {
  const { creatorId } = req.params;
  try {
    const databyCreatorId = await sprintModel.find({ creatorId: creatorId });
    res.send(databyCreatorId);
  } catch (e) {
    res.send({
      message: e.message,
    });
  }
});

// get sprintName data
sprintRouter.get("/", async (req, res) => {
  try {
    const sprintData = await sprintModel.find();
    res.send(sprintData);
  } catch (e) {
    res.send({
      message: e.message,
    });
  }
});

/*
--> update a particular sprint name
   -> if sprintName update happen then tasks should also change their sprint name at that same time. 
*/

sprintRouter.patch(
  "/update/:sprintName/:creatorId/:updatedName",
  async (req, res) => {
    const { sprintName, creatorId, updatedName } = req.params;
    try {
      await sprintModel.updateOne(
        { $and: [{ sprintName: sprintName }, { creatorId: creatorId }] },
        { $set: { sprintName: updatedName } }
      );

      await taskModel.updateMany(
        { $and: [{ sprintName: sprintName }, { creatorId: creatorId }] },
        { $set: { sprintName: updatedName } }
      );

      res.send({
        message: "Update sprint name successfully",
      });
    } catch (err) {
      res.send({
        message: err.message,
      });
    }
  }
);

/*
--> delete sprintName
     -> if sprintName delete happen then tasks should also delete at that same time. 
*/
sprintRouter.delete("/delete", async (req, res) => {
  const { sprintName, creatorId } = req.query;
  try {
    await sprintModel.deleteOne({
      $and: [{ sprintName: sprintName }, { creatorId: creatorId }],
    });

    await taskModel.deleteMany({
      $and: [{ sprintName: sprintName }, { creatorId: creatorId }],
    });

    res.send({
      message: "Delete sprint successfully",
    });
  } catch (error) {
    res.send({
      message: error.message,
    });
  }
});

module.exports = {
  sprintRouter,
};
