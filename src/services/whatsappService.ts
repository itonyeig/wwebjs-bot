import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import prisma from "../prismaClient";
import { generate_AI_response } from "./openAiService";

/**
 * We’ll keep a simple in-memory map for sessions: (better done with redis caching)
 *   key = user’s phone number
 *   Normally I would use a FSM for complex state management but for simplicity, I will just use if statements
 */

interface UserSession {
  name: string | null;
  state: "IDLE" | "FAQ_SELECTION"; //other possible states
  faqs?: { id: number; question: string; answer: string }[]; 
}
const userSessions = new Map<string, UserSession>();

export function initializeWhatsAppBot() {
  console.log(':::Bot initialization in progress:::');
  const whatsapp = new Client({
    authStrategy: new LocalAuth(),
    // puppeteer: {
    //     headless: true,
    // },
  });

  whatsapp.on("qr", (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
  });

  whatsapp.once("ready", () => {
    console.log(":::WhatsApp Bot is connected!:::");
  });

  whatsapp.on("message", async (message: Message) => {
    try {
      const userNumber = message.from;
      const userText = message.body.trim().toLowerCase();

      // Normally, I would handle this with a state management tool like an FSM, but for simplicity's sake, I'll just use if statements.

      // If this is the first time we’ve seen this number, create a session
      if (!userSessions.has(userNumber)) {
        userSessions.set(userNumber, { 
          name: null, 
          state: "IDLE"
        });
        const msg = 
          "Hi! I'm Chaty, your support assistant. What's your name?\n\nPlease respond only with your name";
        message.reply(msg);
        await logQuery(userNumber, message.body.trim(), msg);
        return;
      }

      const sessionData = userSessions.get(userNumber);
      console.log('message received ', sessionData)

      if (!sessionData) return; // Just a sanity check

      // If user hasn’t provided a name yet
      if (sessionData.name === null) {
        const userName = message.body.trim(); 
        sessionData.name = userName;
        sessionData.state = "IDLE";

        const replyMsg = 
          `Nice to meet you, ${userName}! Type 'faq' to see our FAQs.\n` + 
          "You can exit this session anytime by typing 'reset' or 'exit'.";
        message.reply(replyMsg);
        await logQuery(userNumber, userText, replyMsg);
        return;
      }

      // User wants to reset or exit
      if (userText === "reset" || userText === "exit") {
        // Clear session data
        userSessions.delete(userNumber);
        message.reply("Your session has been reset. Send any message to start again.");
        await logQuery(userNumber, userText, "Session reset");
        return;
      }

      if (userText === "faq" || userText === "faqs") {
        const faqs = await prisma.faq.findMany();
        if (faqs.length === 0) {
          message.reply("No FAQs found in the database.");
          await logQuery(userNumber, userText, "No FAQs found");
          return;
        }
      
        // Format only the questions
        let replyText = "Here are our FAQs:\n";
        faqs.forEach((faq, index) => {
          // Just show the question number and question text
          replyText += `\n${index + 1}. ${faq.question}\n`;
        });
      
        // Prompt user to pick a number
        replyText += "\nPlease reply with the corresponding number to see the answer.";
      
        // Update session to store the FAQ array + state
        sessionData.state = "FAQ_SELECTION";
        // Attach an indexed array so #1 maps to faqs[0], #2 maps to faqs[1], ...
        sessionData.faqs = faqs.map((f) => ({ 
          id: f.id, 
          question: f.question, 
          answer: f.answer 
        }));
      
        // Send the message
        message.reply(replyText);
        // Log the query
        await logQuery(userNumber, userText, replyText);
        return;
      }

      // If user is in FAQ_SELECTION mode, interpret their message as a number selection
      if (sessionData.state === "FAQ_SELECTION") {
        // See if the user provided a valid integer
        const faqIndex = parseInt(userText, 10);

        if (isNaN(faqIndex)) {
          const invalidMsg = 
            "You appear to be in FAQ selection mode. Please send the corresponding number or type 'reset' to exit.";
          message.reply(invalidMsg);
          await logQuery(userNumber, userText, invalidMsg);
          return;
        }

        // Valid number, check if it’s in range
        const faqs = sessionData.faqs ?? [];
        if (faqIndex < 1 || faqIndex > faqs.length) {
          const outOfRangeMsg = 
            `Invalid choice. Please send a number between 1 and ${faqs.length}, or type 'reset' to exit.`;
          message.reply(outOfRangeMsg);
          await logQuery(userNumber, userText, outOfRangeMsg);
          return;
        }

        // It's a valid index
        const chosenFaq = faqs[faqIndex - 1];
        const faqAnswer = chosenFaq.answer;

        message.reply(faqAnswer);
        await logQuery(userNumber, userText, faqAnswer);

        // Remain in FAQ_SELECTION so user can ask for more numbers
        return;
      }

      // -- Default fallback --
      message.reply('Thinking, a moment please ....')
      const defaultResponse = await generate_AI_response(userText);
      message.reply(defaultResponse);
      await logQuery(userNumber, userText, defaultResponse);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });
  
  whatsapp.initialize()
}

/**
 * Helper function to log queries to DB
 */
async function logQuery(
  userNumber: string,
  userMessage: string,
  botResponse: string
) {
  try {
    await prisma.messageLog.create({
      data: {
        wa_id: userNumber,
        message: userMessage,
        response: botResponse,
      },
    });
  } catch (err) {
    console.error("Error logging query:", err);
  }
}
