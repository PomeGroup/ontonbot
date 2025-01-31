"use client";

import Typography from "@/components/Typography";
import styles from "./co-organizers.module.css";
import Image from "next/image";
import placeholderImage from "./placeholder.svg";
import LoadableImage from "@/components/LoadableImage";
import { List as KonstaList, Button, Checkbox, Page, Popup, ListItem, Radio } from "konsta/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";
import { useDebouncedValue } from "@mantine/hooks";
import { OntonInput } from "@/components/OntonInput";
import { useGetEvent } from "@/hooks/events.hooks";
import { useParams } from "next/navigation";
import { UserRolesBulkUpsertInput } from "@/types/ActiveUserRole.types";
import channelAvatar from "@/components/icons/channel-avatar.svg";

export default function CoOrganizersPage() {
  const { hash } = useParams() as { hash?: string };

  const { data: eventData } = useGetEvent(hash);

  // We probably need a separate endpoint to
  // get the activation status, usernames, and avatars ONLY for this page.

  const { data } = trpc.userRoles.listAllUserRolesForEventId.useQuery(eventData?.event_id ?? 0, { enabled: !!eventData });
  const [acl, setAcl] = useState<UserRolesBulkUpsertInput[]>([]);
  useEffect(() => {
    if (!data) return;
    setAcl(data.map((item) => ({ ...item, key: `${item.userId}-${item.role}` })));
  }, [data]);

  const {mutateAsync, isLoading } = useMutateAcl();

  const syncServer = async (newAcl: UserRolesBulkUpsertInput[]) => {
    try {
      if (!eventData?.event_id) return;
      const shavedAcl = newAcl.map(({ status, userId, username, role }) => ({
        status,
        userId,
        role,
        username: username as string,
      }));
      const response = await mutateAsync({ itemId: eventData.event_id, itemType: "event", userList: shavedAcl as any });

      console.log(response.data, response)
      setAcl(newAcl);

      toast.success("Updates saved.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save the update.");
    }
  };

  const handleChange = async (id: string, newActive: boolean) => {
    const newAcl = [...acl].map((item) =>
      `${item.userId}-${item.role}` === id
        ? { ...item, status: (newActive ? "active" : "deactivate") as UserRolesBulkUpsertInput["status"] }
        : item
    );
    syncServer(newAcl);
  };

  const [addPopupOpen, setAddPopupOpen] = useState(false);

  const onAdd = async (username: string, role: "admin" | "checkin_officer") => {
    const newAcl = [...acl , {
      userId: 0,
      username: username.trim(),
      role,
      status: "active" as const,
      itemType: "event" as const ,
      itemId: eventData?.event_id ?? 0,
    }];
    await syncServer(newAcl);
    setAddPopupOpen(false);
  }
  return (
    <div className="h-full min-h-screen flex flex-col overflow-hidden bg-[#EFEFF4] p-4">
      <Typography
        className="mb-5"
        variant="title3"
        bold
      >
        Co-Organizers Management
      </Typography>
      <div className="grow">
        {acl.length === 0 ? (
          <EmptyList />
        ) : (
          <List
            data={acl}
            handleActiveChange={handleChange}
          />
        )}
      </div>
      <div className={styles.footer}>
        <Button
          className="py-4 rounded-[6px]"
          onClick={() => setAddPopupOpen(true)}
        >
          Add Co-organizer
        </Button>
      </div>
      <AddPopup
        open={addPopupOpen}
        onAdd={onAdd}
        isSaving={isLoading}
        onClose={() => setAddPopupOpen(false)}
      />
    </div>
  );
}

interface AddPopupProps {
  open: boolean;
  onClose: () => void;
  isSaving: boolean;
  onAdd: (username: string, role: "admin" | "checkin_officer") => void;
}

function AddPopup({ open, onAdd, isSaving, onClose }: AddPopupProps) {
  const [username, setUsername] = useState("@");
  const [role, setRole] = useState<"admin" | "checkin_officer">("checkin_officer");

  const handleAdd = () => {
    onAdd(username.startsWith('@') ? username.substring(1) : username, role);
  };
  return (
    <Popup opened={open}>
      <Page className="flex flex-col h-full p-4">
        <Typography
          variant="title3"
          bold
          className="mb-3"
        >
          Add New User
        </Typography>
        <Typography
          variant="footnote"
          className="font-normal mb-2"
        >
          You can add other users as Co-Organizer so they can help you to manage an event more efficient.
        </Typography>
        <OntonInput
          label="Telegram ID"
          value={username}
          onChange={(e) => setUsername((e.target as any).value)}
        />
        <KonstaList
          strongIos
          outlineIos
          className='-mx-3'
        >
          <ListItem
            label
            title="Admin"
            media={
              <Radio
                component="div"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
              />
            }
          />
          <ListItem
            label
            title="Officer"
            media={
              <Radio
                component="div"
                value="checkin_officer"
                checked={role === "checkin_officer"}
                onChange={() => setRole("checkin_officer")}
              />
            }
          />
        </KonstaList>
        <div className="mt-auto">
          <Button
            className="py-5 mb-3 rounded-[10px]"
            onClick={handleAdd}
            disabled={isSaving}
          >
            Save
          </Button>
          <Button
            outline
            className="py-5 rounded-[10px]"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </Page>
    </Popup>
  );
}

function EmptyList() {
  return (
    <div className={styles.emptyList}>
      <Image
        src={placeholderImage}
        width={1943}
        height={141.6}
        alt=""
      />
      <div className={styles["emptyList-helper"]}>
        <div>
          <Typography
            variant="subheadline2"
            bold
            className='mb-2'>
            No one added as Co-Organizer!
          </Typography>
          <Typography
            variant="subheadline2"
            className="font-medium text-[#8e8e93]"
          >
            You can add users as:
          </Typography>
        </div>
        <div>
          <Typography
            variant="subheadline2"
            bold
            className="mb-2 text-[#ff9500]"
          >
            Admin
          </Typography>
          <Typography
            variant="subheadline2"
            className="font-medium text-[#8e8e93]"
          >
            Can access and manage guests list
          </Typography>
        </div>
        <div>
          <Typography
            variant="subheadline2"
            bold
            className="mb-2 text-[#34C759]"
          >
            Check-in Officer
          </Typography>
          <Typography
            variant="subheadline2"
            className="font-medium text-[#8e8e93]"
          >
            Can access and manage guests list
          </Typography>
        </div>
      </div>
    </div>
  );
}

type ChangeHandler = (id: string, checked: boolean) => void;

function List({ data, handleActiveChange }: { handleActiveChange: ChangeHandler; data: UserRolesBulkUpsertInput[] }) {
  return data.map((item) => (
    <CoOrganizerCard
      data={item}
      key={`${item.userId}-${item.role}`}
      onChange={handleActiveChange}
    />
  ));
}

interface CoOrganizerCardProps {
  onChange: ChangeHandler;
  data: UserRolesBulkUpsertInput;
}

function CoOrganizerCard({ data, onChange }: CoOrganizerCardProps) {
  return (
    <div className={styles["listItem"]}>
      <LoadableImage
        src={channelAvatar.src}
        className={styles["listItem-avatar"]}
        width={48}
        height={48}
      />
      <div className={styles["listItem-data"]}>
        <div className="text-[18px] font-medium">{data.username}</div>
        <div className={data.role === "admin" ? styles["listItem-role--admin"] : styles["listItem-role--officer"]}>
          {data.role}
        </div>
      </div>
      <div className={styles["listItem-checkbox"]}>
        <Checkbox
          checked={data.status === "active"}
          onChange={(e) => onChange(`${data.userId}-${data.role}`, e.target.checked)}
        />
      </div>
    </div>
  );
}

function useMutateAcl() {
  return trpc.userRoles.bulkUpsertUserRolesForEvent.useMutation();
}
