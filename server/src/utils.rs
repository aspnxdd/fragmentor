pub fn are_parts_odd(number: u32) -> bool {
  number % 2 != 0
}

pub fn are_parts_quadratic(parts: u32) -> bool {
  let sqrt = (parts as f32).sqrt();
  sqrt.fract() == 0.0
}

pub fn are_parts_even(parts: u32) -> bool {
  parts % 2 == 0
}