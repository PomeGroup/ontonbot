import Home from '@/components/Authentication/SignInForm';
import SignInForm from "@/components/Authentication/SignInForm";



const Index = () => {
console.log(process.env.NEXT_PUBLIC_BACKEND_URL_CLIENT);
console.log(process.env)
  return (
    <>
      <SignInForm />
    </>
  );
}
export default Index;
