// Metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const eventData = await db.query.events.findFirst({
    where: (fields, { eq }) => {
      return eq(fields.event_uuid, params.UUID);
    },
  });

  if (!eventData) {
    return {
      title: "Onton - Not Found",
    };
  }

  const description = eventData.description?.slice(0, 300);
  return {
    title: eventData.title,
    description,
    openGraph: {
      images: [eventData.image_url as string],
      siteName: "Onton",
      description,
      title: eventData.title || "Onton Event",
    },
  };
}
