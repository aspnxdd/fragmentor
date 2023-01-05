use image::{ open };
use utils::are_parts_quadratic;
use errors::Errors;

mod utils;
mod errors;

fn main() {
  let img_path = String::from("./1.png");

  fragment_image(img_path, 9).unwrap_or_default();
}

type FragmentImageReturn = std::result::Result<(), Errors>;

fn fragment_image(img_path: String, parts: u32) -> FragmentImageReturn {
  let img = open(img_path).unwrap().into_rgb8();
  let (width, height) = img.dimensions();

  let dyn_img = image::DynamicImage::ImageRgb8(img.clone());

  let parts_sqrt = (parts as f32).sqrt().floor() as u32;

  let fragment_widths = (height / parts_sqrt, height / parts_sqrt);
  let fragment_heights = (width / parts_sqrt, width / parts_sqrt);

  if !are_parts_quadratic(parts) {
    return Err(Errors::WrongParts);
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

    if j * w >= width + 5 || j * w >= width - 5 || i * h >= height + 5 || i * h >= height - 5 {
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

    dyn_img.crop_imm(j * w, i * h, w, h).save(format!("./{}-{}.png", i, j))?;
  }
  Ok(())
}