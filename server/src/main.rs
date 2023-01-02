use image::open;
use utils::{ are_parts_even, are_parts_odd, are_parts_quadratic };

mod utils;

fn main() {
  let img_path = String::from("./1.png");

  fragment_image(img_path, 3);
}

fn fragment_image(img_path: String, parts: u32) {
  let img = open(img_path).unwrap().into_rgb8();

  let dyn_img = image::DynamicImage::ImageRgb8(img.clone());

  let (width, height) = img.dimensions();
  let mut fragment_widths = (0, 0);
  let mut fragment_heights = (0, 0);

  let parts_sqrt = (parts as f32).sqrt().floor() as u32;

  if are_parts_quadratic(parts) {
    fragment_heights.0 = height / parts_sqrt;
    fragment_heights.1 = fragment_heights.0;
    fragment_widths.0 = width / parts_sqrt;
    fragment_widths.1 = fragment_widths.0;
  } else if are_parts_even(parts) {
    fragment_heights.0 = height / parts_sqrt;
    fragment_heights.1 = fragment_heights.0;
    fragment_widths.0 = width / (parts_sqrt + 1);
    fragment_widths.1 = fragment_widths.0;
  } else if are_parts_odd(parts) {
    fragment_heights.0 = height / parts_sqrt;
    fragment_heights.1 = height / (parts_sqrt + 1);
    fragment_widths.0 = width / parts_sqrt;
    fragment_widths.1 = width / (parts_sqrt + 1);
  }

  let mut j = 0;
  let mut i = 0;

  for part in 0..parts {
    let mut w = fragment_widths.0;
    let mut h = fragment_heights.0;
    if part <= parts / 2 {
      w = fragment_widths.1;
      h = fragment_heights.1;
    }

    if j * w >= width || i * h >= height {
      j = 0;
      i += 1;
    } else if part == 0 {
      j = 0;
    } else {
      j += 1;
    }
    if j * w >= width + 5 || j * w >= width - 5 || i * h >= height + 5 || i * h >= height - 5 {
      j = 0;
      i += 1;
    }

    println!("w{} - h{} - j{} - i{} - x{} - y{}", w, h, j, i, j * w, i * h);

    dyn_img
      .crop_imm(j * w, i * h, w, h)
      .save(format!("./{}-{}.png", i, j))
      .unwrap_or_default();
  }
}