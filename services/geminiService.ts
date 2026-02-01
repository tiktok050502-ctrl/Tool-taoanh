import { GoogleGenAI } from "@google/genai";
import { AppMode, AspectRatio, JewelryPosition, ImageResolution, VideoPrompt } from "../types";

const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
};

// --- OPTIMIZATION: IMAGE COMPRESSION ---
// Reduces upload time from minutes to seconds by resizing large images
const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Convert to JPEG for better compression than PNG for photos
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str); // Fallback
      }
    };
    img.onerror = () => resolve(base64Str); // Fallback
  });
};

interface TryOnParams {
  apiKey: string;
  productImage: string;
  personImage: string;
  mode: AppMode;
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  position?: JewelryPosition;
}

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  
  // 1. Instant check: Google keys always start with AIza
  if (!apiKey.trim().startsWith("AIza")) {
    return false;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // 2. Add Timeout: Fail if request takes longer than 5 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Validation Timed Out")), 5000)
    );

    const apiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: 'Ping' }] },
    });

    // Race between API call and Timeout
    await Promise.race([apiPromise, timeoutPromise]);
    
    return true;
  } catch (error) {
    console.warn("API Key Validation Failed:", error);
    return false;
  }
};

export const generateTryOnImage = async ({
  apiKey,
  productImage,
  personImage,
  mode,
  aspectRatio,
  resolution,
  position
}: TryOnParams): Promise<string> => {
  
  if (!apiKey) {
    throw new Error("Vui lòng nhập API Key trong phần cài đặt.");
  }

  // 1. Optimize Images BEFORE sending to API
  const [optimizedProduct, optimizedPerson] = await Promise.all([
    compressImage(productImage),
    compressImage(personImage)
  ]);

  const ai = new GoogleGenAI({ apiKey });

  // 2. Select Model based on Resolution preference
  const isPro = resolution === ImageResolution.UHD;
  const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  let systemInstruction = "";
  let userPrompt = "";

  if (mode === AppMode.JEWELRY) {
    const pos = position === 'cầm tay' ? 'holding the jewelry in hand' : 
                position === 'đeo tay' ? 'wearing the jewelry on the wrist' :
                position === 'đeo cổ' ? 'wearing the jewelry around the neck' :
                position === 'đeo tai' ? 'wearing the jewelry on the ear' : 'wearing it';

    systemInstruction = `You are an Expert Photo Retoucher & Compositor.
    TASK: Photo-realistic Product Placement (Virtual Try-On).
    
    STRICT RULES:
    1. SOURCE TRUTH: The object in Image 1 (Product) is the ABSOLUTE TRUTH. You must NOT generate a new design. You must "cut" the object from Image 1 and "paste" it onto Image 2.
    2. TARGET PRESERVATION: The person in Image 2 (Model) must NOT change face, body shape, or skin tone. Only the jewelry area changes.
    3. PHYSICS: Apply realistic shadows, reflections, and skin displacement where the jewelry touches the skin.`;
    
    userPrompt = `
      ACTION: Put the JEWELRY from Image 1 onto the PERSON in Image 2.
      POSITION: The person should be ${pos}.
      
      STEPS:
      1. Analyze the texture, material (gold/silver/diamond), and shape of the item in Image 1.
      2. Warp and resize that EXACT item to fit the anatomy of the person in Image 2.
      3. Blend the edges naturally (contact shadows).
      4. DO NOT change the person's face or background.
    `;
  } else {
    // Fashion Mode
    systemInstruction = `You are an AI Virtual Try-On Engine.
    TASK: Cloth Replacement / Garment Transfer.
    
    STRICT RULES:
    1. CLOTHING TRANSFER: Identify the garment in Image 1. Replace the outfit of the person in Image 2 with that EXACT garment.
    2. TEXTURE MAPPING: Preserve the pattern, logo, fabric texture, and color of the garment from Image 1. Do not hallucinate new patterns.
    3. FIT & DRAPE: The new garment must wrap around the body of the person in Image 2 realistically (wrinkles, tension, gravity).
    4. IDENTITY LOCK: The person's face, hair, and pose in Image 2 must remain exactly the same.`;

    userPrompt = `
      ACTION: Dress the PERSON in Image 2 with the CLOTHING from Image 1.
      
      STEPS:
      1. Remove the original clothes of the person in Image 2.
      2. Apply the garment from Image 1 onto the body of the person.
      3. Ensure the fit is realistic for the person's pose.
      4. Lighting on the clothes must match the environment of Image 2.
      5. OUTPUT: A photorealistic photo of the person wearing the new clothes.
    `;
  }

  const config: any = {
    systemInstruction,
    imageConfig: {
      aspectRatio: aspectRatio,
    }
  };
  
  if (isPro) {
    config.imageConfig.imageSize = '2K';
  }

  // Explicitly labeling inputs helps the model distinguish Source vs Target
  const parts = [
    { text: userPrompt },
    { text: "--- IMAGE 1: REFERENCE_PRODUCT (SOURCE TEXTURE) ---" },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64(optimizedProduct)
      }
    },
    { text: "--- IMAGE 2: TARGET_MODEL (DESTINATION CANVAS) ---" },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64(optimizedPerson)
      }
    }
  ];

  console.log(`Generating with ${modelName} (Strict Try-On Logic)...`);

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Không nhận được dữ liệu ảnh từ AI.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let msg = error.message || "Unknown error";
    const msgLower = msg.toLowerCase();

    // Catch Quota Exceeded specifically
    if (msgLower.includes('quota') || msgLower.includes('429') || msgLower.includes('resource_exhausted')) {
       throw new Error("QUOTA_EXCEEDED");
    }
    
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      if (isPro) {
        throw new Error("Tài khoản của bạn chưa hỗ trợ Model Pro (UHD). Hãy thử chọn chất lượng HD/SD.");
      }
      throw new Error("Lỗi quyền truy cập API (403). Kiểm tra lại Key.");
    }
    if (msg.includes('500') || msg.includes('503')) {
      throw new Error("Lỗi máy chủ Google (500). Hãy thử giảm chất lượng xuống SD/HD.");
    }
    throw new Error(`Lỗi tạo ảnh: ${msg}`);
  }
};

// --- GENERATE VIDEO PROMPTS ---
export const generateVideoPrompts = async (
  apiKey: string, 
  count: number, 
  mode: AppMode, 
  generatedImageBase64?: string
): Promise<VideoPrompt[]> => {
  if (!apiKey) throw new Error("API Key is required");

  // Optimize reference image if present
  let optimizedRef = null;
  if (generatedImageBase64) {
    optimizedRef = await compressImage(generatedImageBase64, 800, 0.7);
  }

  const ai = new GoogleGenAI({ apiKey });
  // Use gemini-2.5-flash -> Fastest for text/JSON generation
  const model = "gemini-2.5-flash"; 

  const isJewelry = mode === AppMode.JEWELRY;
  const category = isJewelry ? "Luxury Jewelry / Watches" : "High Fashion / Designer Clothing";
  
  // Updated focus: DYNAMIC MOVEMENT
  const focus = isJewelry 
    ? "ELEGANT MOVEMENTS. Model gently turns head, lifts hand to face, or adjusts the jewelry. Movements capture light reflections." 
    : "FASHION MODELING. Catwalk strut, 360-degree twirl, shifting weight, hand-in-pocket poses. Show fabric flow and outfit angles.";

  // Updated System Instruction for Active Modeling
  const systemInstruction = `
    You are a Director for High-End Fashion & Commercial Video.
    Write ${count} Image-to-Video prompts for AI Generators (Sora/Veo/Luma).
    
    INPUT: ${mode} Context.
    OUTPUT: JSON Array ONLY.

    CRITICAL RULES:
    1. **MODEL MOVEMENT**: The model MUST MOVE professionally to showcase the product.
       - ${isJewelry ? 'JEWELRY MODE: Slow, deliberate, graceful movements. Touching the ear/neck, slight head turns to catch the light.' : 'FASHION MODE: Confident, dynamic posing. Walking towards camera, turning around to show back of outfit, twirling to show skirt volume.'}
    
    2. **CAMERA MOVEMENT**: Cinematic tracking.
       - Follow the model's movement. 
       - Use Dolly In/Out and Orbit to keep the product in focus while the model moves.

    3. **STRICT CONTINUITY**: Frame N+1 MUST start exactly where Frame N ended. 
       - If Frame 1 ends with the model turning left, Frame 2 starts with the model continuing that turn.
    
    4. **STYLE**: Cinematic, Expensive, Studio Lighting, 8k resolution.

    JSON STRUCTURE:
    [
      { 
        "frame": 1, 
        "action": "Model walks forward...", 
        "camera_movement": "Dolly Back / Tracking", 
        "prompt_text": "Medium shot, model struts confidently towards the camera wearing [product], fabric flowing naturally, cinematic lighting..." 
      }
    ]
  `;

  const userPromptText = `
    Create exactly ${count} video prompts for ${category}.
    Focus: ${focus}
    Constraint: Dynamic Professional Modeling. Show off the product through movement.
    Return JSON only.
  `;

  const parts: any[] = [{ text: userPromptText }];
  
  if (optimizedRef) {
    parts.push({ text: "Reference Image (Start Frame):" });
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64(optimizedRef)
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text generated");
    
    return JSON.parse(text) as VideoPrompt[];
  } catch (error: any) {
    console.error("Prompt Gen Error:", error);
    let msg = error.message || "";
    if (msg.toLowerCase().includes('quota') || msg.includes('429')) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error("Failed to generate video prompts: " + error.message);
  }
};