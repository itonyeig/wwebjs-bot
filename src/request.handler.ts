import { Request, Response } from "express";
import prisma from "./prismaClient";


export async function FAQsHandler(req: Request, res: Response) {
    try {
        const faqs = await prisma.faq.findMany();
          return res.json({ faqs });
    } catch (error) {
      console.log(error);
    }
  }