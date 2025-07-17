import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";

const Page = async (params: any) => {
  noStore();
  const heads = await headers();
  const header_url = heads.get("x-url") || "";

  return (
    <div>
      {header_url}- url
            {JSON.stringify(/* @next-codemod-error 'params' is passed as an argument. Any asynchronous properties of 'props' must be awaited when accessed. */
      params)}- params
            {JSON.stringify(heads)}- headers
          </div>
  );
};

export default Page;
