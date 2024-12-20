import React, { useEffect, useState } from 'react';

const ImageHandle = () => {
  const [base64Images, setBase64Images] = useState<string[]>([]);

  const handleFileChange = (event:any) => {
    const files = event.target.files;
    if (!files) return;

    const convertImagesToBase64 = async () => {
      const base64Array = await Promise.all(
        Array.from(files).map(async (file) => {
          const reader = new FileReader();
          return new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );
      setBase64Images(base64Array);
    };

    convertImagesToBase64();
  };

  return (
    <div>
      <input type="file" accept="image/*" multiple onChange={handleFileChange} />
      <div>
        {base64Images.map((base64, index) => (
          <img key={index} src={base64} alt={`Image ${index + 1}`} />
        ))}
      </div>
    </div>
  );
};

export default ImageHandle;