export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index++) sum += Number(cpf[index]) * (10 - index);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index++) sum += Number(cpf[index]) * (11 - index);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

export function isValidCnpj(value: string) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calculate = (length: number) => {
    let sum = 0;
    let weight = length - 5;
    for (let index = 0; index < length; index++) {
      sum += Number(cnpj[index]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13]);
}

export function isValidCpfOrCnpj(value: string) {
  const digits = digitsOnly(value);
  return digits.length === 11 ? isValidCpf(value) : digits.length === 14 && isValidCnpj(value);
}

export function isAdultBirthDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) return false;
  const today = new Date();
  const minimum = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const maximum = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const localDate = new Date(`${value}T00:00:00`);
  return localDate >= minimum && localDate <= maximum;
}
