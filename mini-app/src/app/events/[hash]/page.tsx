'use client';

import { EventDataPage } from "@/app/_components/Event/EventPage";

type Props = { params: { hash: string } };

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   const eventData = await db.query.events.findFirst({
//     where: (fields, { eq }) => {
//       return eq(fields.event_uuid, params.hash);
//     },
//   });

//   if (!eventData) {
//     return {
//       title: "Onton - Not Found",
//     };
//   }

//   const description = eventData.description?.slice(0, 300);
//   return {
//     title: eventData.title,
//     description,
//     openGraph: {
//       images: [eventData.image_url as string],
//       siteName: "Onton",
//       description,
//       title: eventData.title || "Onton Event",
//     },
//   };
// }

export async function EventPage({ params }: Props) {
  if (params.hash.length !== 36) {
    return <div>Incorrect event link. Startapp param should be 36 characters long</div>;
  }

  return <EventDataPage eventHash={params.hash} />;
}

export default EventPage;

export const dynamic = "force-dynamic";
