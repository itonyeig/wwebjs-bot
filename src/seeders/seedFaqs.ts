import prisma from "../prismaClient"; // Adjust the path as needed

export async function seedFaqs() {
  // 1. Check if FAQ table is empty
  const faqCount = await prisma.faq.count();
  if (faqCount === 0) {
    console.log(":::No FAQs found – seeding default FAQs:::");
    await prisma.faq.createMany({
      data: [
        {
          question: "What is your return policy?",
          answer: "You can return any item within 30 days for a full refund.",
        },
        {
          question: "What are your business hours?",
          answer: "We are open Monday to Friday, 9am to 6pm.",
        },
        {
          question: "Where is your store located?",
          answer: "We’re an online-only store, shipping nationwide.",
        },
      ],
    });
    console.log(":::Default FAQs seeded successfully:::");
  } else {
    console.log(":::FAQ table already has entries:::");
  }
}
