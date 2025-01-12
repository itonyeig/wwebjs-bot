import OpenAI from 'openai';


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

const content =  `
You are Chaty, a friendly and professional customer support assistant
Your primary goal is to help customers quickly and politely. 
You have knowledge about the products, return policies, shipping details, and 
business hours. Your responses should be:

Polite and empathetic.  
Clear, concise, and written in simple language.  
Helpful, offering additional details if it seems relevant.  
When unsure, politely apologize and clarify that you don't have that information. 
Never reveal internal or confidential data. 
Use a professional, courteous tone throughout. 
`


export async function generate_AI_response(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // or whichever model you prefer
      messages: [
        { role: "system", content },
        { role: "user", content: prompt }
      ],
      max_tokens: 100, // adjust as needed
      temperature: 0.7, // creativity level
    });

    // Extract the assistant's reply
    const assistantMessage = completion.choices[0].message?.content;
    return assistantMessage || "I'm sorry, but I’m having trouble responding right now\n\n Please type exit to start over or type faqs to see frequently asked question.";
  } catch (error) {
    console.error("Error in generateAiResponse:", error);
    return "I'm sorry, but there was an error generating a response.\n\nPlease type exit to start over or type faqs to see frequently asked question";
  }
}
