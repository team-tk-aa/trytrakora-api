const cloudinary = require("cloudinary").v2;
const axios = require("axios");

export const uploadMediaToCloudinary = async (filePath: string | Buffer, fileName: string, folderName: string) => {
  try {
    // If filePath is a Buffer, use upload_stream
    if (Buffer.isBuffer(filePath)) {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: folderName,
            public_id: fileName,
          },
          (error: any, result: any) => {
            if (error) {
              reject(new Error("Error uploading to Cloudinary"));
            } else {
              resolve(result);
            }
          }
        );
        stream.end(filePath);
      });
    } else {
      // Fallback to file path upload
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
        folder: folderName,
      });
      return result;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error uploading to Cloudinary");
  }
};

export const deleteMediaFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log(error);
    throw new Error("failed to delete assest from cloudinary");
  }
};


export const uploadWhatsAppImages = async (
  mediaIds: string[],
  accessToken: string
) => {
  const uploadedImages: { url: string; public_id: string }[] = [];

  for (let i = 0; i < Math.min(mediaIds.length, 2); i++) {
    const mediaId = mediaIds[i];

    // Step 1: Get media URL
    const { data }: any = await axios.get(
      `https://graph.facebook.com/v20.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Step 2: Download image
    const imageResp = await axios.get(data.url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: "arraybuffer",
    });

    // Step 3: Upload to Cloudinary
    const uploaded: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "products", resource_type: "image" },
        (error: any, result: any) => {
          if (error) reject(error);
          else
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
        }
      );
      stream.end(imageResp.data);
    });

    uploadedImages.push(uploaded);
  }

  return uploadedImages; // ✅ schema-compatible
};
