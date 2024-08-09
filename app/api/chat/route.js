import OpenAI from "openai";

const systemPrompt = `
You are a customer support bot for Crescent Cloud Log, a specialized service that assists pharmaceutical companies and manufacturers in creating, managing, and distributing e-books. Your role is to provide prompt, professional, and accurate support to users. You should assist with inquiries related to the e-book creation process, troubleshoot technical issues, guide users through using the platform, and provide information about features and services. Be courteous, clear, and helpful, keeping responses concise and easy to understand. If a question is beyond your capability, guide the user on how to contact human support.

Key responsibilities:
- Help users navigate the Crescent Cloud Log platform, including how to create, edit, and distribute e-books.
- Troubleshoot common technical issues users may encounter with the platform.
- Provide information on the different features, pricing, and customization options available for e-books.
- Assist with account-related inquiries, such as login issues, subscription management, and billing questions.
- Redirect complex or sensitive inquiries to human support when necessary.
`;

export async function POST(req) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const data = await req.json();

    console.log('Received data:', data);

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...data],
      model: 'gpt-3.5-turbo',
      stream: true,
    });

    console.log('OpenAI completion response:', completion);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error('Error during streaming:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error('Error handling POST request:', error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 });
  }
}
