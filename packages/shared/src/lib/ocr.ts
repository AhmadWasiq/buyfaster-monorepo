// OCR API endpoint
const OCR_API_ENDPOINT = '/api/ocr';

// Compress and resize image
export const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert image URL to base64
export const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File([blob], 'image.jpg', { type: blob.type });
  return fileToBase64(file);
};

// Process image with OCR using backend API
export const processOCR = async (imageFile: File | string): Promise<string> => {
  try {
    let imageData: string;

    if (typeof imageFile === 'string') {
      // If it's a URL, convert to base64 with data URL prefix
      const base64Image = await imageUrlToBase64(imageFile);
      imageData = `data:image/jpeg;base64,${base64Image}`;
    } else {
      // If it's a file, compress it first to reduce payload size
      const maxFileSize = 5 * 1024 * 1024; // 5MB threshold for compression
      
      let processedFile = imageFile;
      if (imageFile.size > maxFileSize) {
        console.log(`Image is ${(imageFile.size / 1024 / 1024).toFixed(2)}MB, compressing...`);
        processedFile = await compressImage(imageFile);
        console.log(`Compressed to ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
      }

      // Convert to data URL
      imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(processedFile);
      });
    }

    // Call backend API
    const response = await fetch(OCR_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'OCR processing failed');
    }

    return result.text;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process image with OCR');
  }
};

// Process image from camera capture (canvas or video element)
export const processCameraImage = async (imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Set canvas size to image size
    const element = imageElement as any;
    canvas.width = imageElement.width || element.videoWidth || 800;
    canvas.height = imageElement.height || element.videoHeight || 600;

    // Draw the image to canvas
    ctx.drawImage(imageElement, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Could not convert canvas to blob'));
        return;
      }

      try {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const result = await processOCR(file);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, 'image/jpeg', 0.8);
  });
};
