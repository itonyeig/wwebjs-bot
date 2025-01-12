import dotenv from "dotenv";
dotenv.config();
import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal';
import cors from "cors";
import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import prisma from "./prismaClient";
import { seedFaqs } from './seeders/seedFaqs';
import { initializeWhatsAppBot } from './services/whatsappService';


async function initializeApp() {
  try {
    console.log(":::connecting to database:::");
    await prisma.$connect();
    console.log(":::connected to database:::");

    // Seed FAQs if none exist
    await seedFaqs();

    const app: Application = express();
    const port = process.env.PORT || 4000;

    app.use(cors());

    // Middleware
    app.use(express.json());
    app.use(morgan("dev"));

    // GET route for home
    app.get("/", (req: Request, res: Response) => {
      res.json({ message: "Server is up and running" });
    });

    // Example routes
    app.get("/faqs", async (req: Request, res: Response) => {
      const faqs = await prisma.faq.findMany();
      res.json({ faqs });
    });
    
    app.get("/messages", async (req: Request, res: Response) => {
      const messages = await prisma.messageLog.findMany();
      res.json({ messages });
    });

    app.post("/whatsapp-webhook", async (req: Request, res: Response) => {
      // using whatsapp business api
      const body = req.body
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].field === 'messages' && // Ensures it's a message event
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0] &&
        body.entry[0].changes[0].value.messages[0].type === 'text' && // Check if it's a text message
        body.entry[0].changes[0].value.contacts && // Ensures contacts field is present
        body.entry[0].changes[0].value.contacts[0]
      ) {
        res.sendStatus(200);
        // server processing goes here
      }
    });

    
    app.listen(port, () => {
      console.log(`Server running on port ${port} 🚀🚀🚀`);
      initializeWhatsAppBot(); 
    });
    
    
  } catch (err) {
    console.error("Error in connecting to database:", err);
    process.exit(1); // Exit if DB connection fails
  }
}

initializeApp();