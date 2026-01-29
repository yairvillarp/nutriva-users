// Mock upload function
export const uploadFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Return a fake URL or a local object URL
            resolve(URL.createObjectURL(file));
        }, 1500);
    });
};
