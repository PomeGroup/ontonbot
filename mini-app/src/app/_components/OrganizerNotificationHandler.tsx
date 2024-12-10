"use client";

import React, { useEffect, useState } from "react";
import useNotificationStore from "@/zustand/useNotificationStore";
import { NotificationType, NotificationStatus, NotificationItemType } from "@/db/schema";
import { Card, Block, List, ListItem, Badge } from "konsta/react"; // Using available Konsta UI components

type OrganizerNotification = {
  notificationId: string;
  userId: number;
  type: NotificationType;
  title: string;
  desc: string;
  actionTimeout: number | string;
  additionalData: {
    participant_id?: number;
    event_id?: number;
    poa_id?: string;
    notification_id?: number;
  };
  priority: number;
  itemId: string;
  item_type: NotificationItemType;
  status: NotificationStatus;
  createdAt: string;
  expiresAt: string;
  id: string;
};

const OrganizerNotificationHandler: React.FC = () => {
  const notifications = useNotificationStore((state) => state.notifications);

  const [poaCreatedCount, setPoaCreatedCount] = useState<number>(0);
  const [poaSentCount, setPoaSentCount] = useState<number>(0);
  const [userAnswerPoaCount, setUserAnswerPoaCount] = useState<number>(0); // New state for USER_ANSWER_POA

  // Helper Sets to track unique notifications
  const [handledPoaCreationIds, setHandledPoaCreationIds] = useState<Set<string>>(new Set());
  const [handledPoaSentIds, setHandledPoaSentIds] = useState<Set<string>>(new Set());
  const [handledUserAnswerPoaIds, setHandledUserAnswerPoaIds] = useState<Set<string>>(new Set()); // New Set for USER_ANSWER_POA

  // Effect to handle POA_CREATION_FOR_ORGANIZER notifications
  useEffect(() => {
    console.log("Checking for new POA_CREATION_FOR_ORGANIZER notifications...");

    // Filter notifications of type POA_CREATION_FOR_ORGANIZER
    const newPoaCreations = notifications.filter(
      (n) =>
        n.type === "POA_CREATION_FOR_ORGANIZER" &&
        !handledPoaCreationIds.has(n.notificationId)
    );

    if (newPoaCreations.length > 0) {
      console.log(`Found ${newPoaCreations.length} new POA_CREATION_FOR_ORGANIZER notifications.`);
      setPoaCreatedCount((prev) => prev + newPoaCreations.length);

      // Update handled IDs
      const newHandledIds = new Set(handledPoaCreationIds);
      newPoaCreations.forEach((n) => newHandledIds.add(n.notificationId));
      setHandledPoaCreationIds(newHandledIds);
    } else {
      console.log("No new POA_CREATION_FOR_ORGANIZER notifications found.");
    }
  }, [notifications, handledPoaCreationIds]);

  // Effect to handle USER_RECEIVED_POA notifications
  useEffect(() => {
    console.log("Checking for new USER_RECEIVED_POA notifications...");

    // Filter notifications of type USER_RECEIVED_POA
    const newPoaSent = notifications.filter(
      (n) =>
        n.type === "USER_RECEIVED_POA" &&
        !handledPoaSentIds.has(n.notificationId)
    );

    if (newPoaSent.length > 0) {
      console.log(`Found ${newPoaSent.length} new USER_RECEIVED_POA notifications.`);
      setPoaSentCount((prev) => prev + newPoaSent.length);

      // Update handled IDs
      const newHandledIds = new Set(handledPoaSentIds);
      newPoaSent.forEach((n) => newHandledIds.add(n.notificationId));
      setHandledPoaSentIds(newHandledIds);
    } else {
      console.log("No new USER_RECEIVED_POA notifications found.");
    }
  }, [notifications, handledPoaSentIds]);

  // New Effect to handle USER_ANSWER_POA notifications
  useEffect(() => {
    console.log("Checking for new USER_ANSWER_POA notifications...");

    // Filter notifications of type USER_ANSWER_POA
    const newUserAnswerPoa = notifications.filter(
      (n) =>
        n.type === "USER_ANSWER_POA" &&
        !handledUserAnswerPoaIds.has(n.notificationId)
    );

    if (newUserAnswerPoa.length > 0) {
      console.log(`Found ${newUserAnswerPoa.length} new USER_ANSWER_POA notifications.`);
      setUserAnswerPoaCount((prev) => prev + newUserAnswerPoa.length);

      // Update handled IDs
      const newHandledIds = new Set(handledUserAnswerPoaIds);
      newUserAnswerPoa.forEach((n) => newHandledIds.add(n.notificationId));
      setHandledUserAnswerPoaIds(newHandledIds);
    } else {
      console.log("No new USER_ANSWER_POA notifications found.");
    }
  }, [notifications, handledUserAnswerPoaIds]);

  return (
    <Block>
      <Card>
        <List>
          {/* POAs Created */}
          <ListItem>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <strong>POAs Created</strong>
              <Badge color="primary">{poaCreatedCount}</Badge>
            </div>
          </ListItem>

          {/* POAs Sent to Users */}
          <ListItem>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <strong>POAs Sent to Users</strong>
              <Badge color="secondary">{poaSentCount}</Badge>
            </div>
          </ListItem>

          {/* USER_ANSWER_POA Notifications */}
          <ListItem>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <strong>User POA Answers</strong>
              <Badge color="warning">{userAnswerPoaCount}</Badge>
            </div>
          </ListItem>
        </List>
      </Card>
    </Block>
  );
};

export default OrganizerNotificationHandler;
