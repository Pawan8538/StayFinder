export const getImageUrl = (imgPath) => {
  if (!imgPath) return "/default.jpg"; // fallback image
  return imgPath.startsWith("http")
    ? imgPath
    : `${import.meta.env.VITE_BASE_URL}${imgPath}`;
};
