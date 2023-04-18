const express = require("express");
const fs = require("fs");
const multer = require("multer");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const path = require("node:path");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: false }));

app.use(cors());

const port = process.env.PORT || 8000

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const fileName = `${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

const middle = {
  clearDir: function (req, res, next) {
    try {
      fs.readdir("uploads/", (err, files) => {
        for (const file of files) {
          fs.unlink(path.join("uploads/", file), (err) => {
            if (err) throw err;
          });
        }
      });
    } catch (err) {
      console.error(err);
    }
    next();
  },
  uploadss: upload.single("file"),
};

app.get("/",(req,res)=>{
  res.send("hello")
})
app.post("/", [middle.clearDir, middle.uploadss], async (req, res) => {
  const dataBuffer = fs.readFileSync(`./uploads/${req.file.originalname}`);
  let file_type = req.file.originalname.split(".");
  file_type = file_type[file_type.length - 1];
  if (file_type === "pdf") {
    pdf(dataBuffer)
      .then((data) => {
        return data.text;
      })
      .then((result) => {
        textForm(result);
      })
      .catch((e) => console.log(e));
    console.log(req.file);
  } else if (file_type === "docx") {
    mammoth
      .extractRawText({ buffer: dataBuffer })
      .then((result) => {
        return result.value;
      })
      .then((result) => {
        textForm(result);
      })
      .catch((e) => console.log(e));
  }
  const textForm = async (file_text) => {
    return res.status(200).json({
        success: true,
        message: file_text,
      });
  }
});

app.listen(port, () => {
  console.log("server started at ",port);
});


