
export interface LoginRequest{
    username:string;
    password:string;
}
export interface LoginResponse{
    success:boolean;
    code:number;
    message:string;
    data: {
        email: string;
  };
}