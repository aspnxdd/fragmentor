use image::ImageError;

pub enum Errors {
  WrongParts,
  ImageError(ImageError),
}

impl From<ImageError> for Errors {
  fn from(err: ImageError) -> Self {
    Errors::ImageError(err)
  }
}

impl std::fmt::Display for Errors {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    match self {
      Errors::WrongParts => write!(f, "The parts are not quadratic"),
      Errors::ImageError(err) => write!(f, "Image error: {}", err),
    }
  }
}