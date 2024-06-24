export class RegisterDto {
  constructor(id: string, password: string, url: string) {
    this.id = id;
    this.password = password;
    this.url = url;
  }

  id: string;
  password: string;
  url: string;
}
