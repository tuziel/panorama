export default function loadImage(...srcs: string[]) {
  return Promise.all<HTMLImageElement>(
    srcs.map(
      (src) =>
        new Promise((resolve) => {
          var image = new Image();
          image.onload = () => resolve(image);
          image.src = src;
        }),
    ),
  );
}
