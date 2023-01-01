use image::{ open, Rgb, ImageBuffer };

fn main() {
  let img_path = String::from("./1.png");

  fragment_image(img_path, 6);
}

fn are_parts_odd(number: u32) -> bool {
  number % 2 != 0
}

fn are_parts_quadratic(parts: u32) -> bool {
  let sqrt = (parts as f32).sqrt();
  sqrt.fract() == 0.0
}

fn are_parts_even(parts: u32) -> bool {
  parts % 2 == 0
}

fn fragment_image(img_path: String, parts: u32) {
  let img = open(img_path).unwrap().into_rgb8();

  let dyn_img = image::DynamicImage::ImageRgb8(img.clone());

  let (width, height) = img.dimensions();
  let mut fragment_width = 0;
  let mut fragment_height = 0;

  let parts_sqrt = (parts as f32).sqrt() as u32;

  if are_parts_quadratic(parts) {
    fragment_height = height / parts_sqrt;
    fragment_width = width / parts_sqrt;
  } else if are_parts_even(parts) {
    fragment_height = height / parts_sqrt;
    fragment_width = width / (parts_sqrt + 1);
  }
  // else if are_parts_odd(parts) {
  //   let w = (parts as f32).sqrt().floor() as u32;
  //   let c = w + 1;
  //   println!("w: {} c: {} parts: {}", w, c, parts);
  //   fragment_height = height / (c / 1);
  //   fragment_width = width / (w / 1);
  // }

  let mut imgs: Vec<ImageBuffer<Rgb<u8>, Vec<u8>>> = Vec::new();

  for i in 0..parts {
    let mut img = ImageBuffer::new(fragment_width, fragment_height);
    let mut x = 0;
    let mut y = 0;

    for x in 0..fragment_width {
      for y in 0..fragment_height {
        let pixel = img.get_pixel(x, y);
        img.put_pixel(x, y, *pixel);
      }
    }

    imgs.push(img);
  }

  let mut img1 = image::RgbImage::new(fragment_width, fragment_height);
  let mut img2 = image::RgbImage::new(fragment_width, fragment_height);
  let mut img3 = image::RgbImage::new(fragment_width, fragment_height);
  let mut img4 = image::RgbImage::new(fragment_width, fragment_height);
  let mut img5 = image::RgbImage::new(fragment_width, fragment_height);
  let mut img6 = image::RgbImage::new(fragment_width, fragment_height);

  for x in 0..fragment_width {
    for y in 0..fragment_height {
      let pixel = img.get_pixel(x, y);
      img1.put_pixel(x, y, *pixel);
    }
  }

  for x in fragment_width..fragment_width * 2 {
    for y in 0..fragment_height {
      let pixel = img.get_pixel(x, y);
      img2.put_pixel(x - fragment_width, y, *pixel);
    }
  }

  for x in fragment_width * 2..fragment_width * 3 {
    for y in 0..fragment_height {
      let pixel = img.get_pixel(x, y);
      img3.put_pixel(x - fragment_width * 2, y, *pixel);
    }
  }

  for x in 0..fragment_width {
    for y in fragment_height..fragment_height * 2 {
      let pixel = img.get_pixel(x, y);
      img4.put_pixel(x, y - fragment_height, *pixel);
    }
  }

  for x in fragment_width..fragment_width * 2 {
    for y in fragment_height..fragment_height * 2 {
      let pixel = img.get_pixel(x, y);
      img5.put_pixel(x - fragment_width, y - fragment_height, *pixel);
    }
  }

  for x in fragment_width * 2..fragment_width * 3 {
    for y in fragment_height..fragment_height * 2 {
      let pixel = img.get_pixel(x, y);
      img6.put_pixel(x - fragment_width * 2, y - fragment_height, *pixel);
    }
  }

  img1.save("./1-1.png").unwrap();
  img2.save("./1-2.png").unwrap();
  img3.save("./1-3.png").unwrap();
  img4.save("./1-4.png").unwrap();
  img5.save("./1-5.png").unwrap();
  img6.save("./1-6.png").unwrap();
}