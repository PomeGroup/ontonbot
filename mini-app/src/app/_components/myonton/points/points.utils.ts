import type { UsersScoreActivityType } from "@/db/schema/usersScore";

export function getTitle(type: UsersScoreActivityType) {
  switch (type) {
    case "free_online_event":
      return "Participated Free Online Events";
    case "free_offline_event":
      return "Participated Free In-Person Events";
    case "paid_online_event":
      return "Participated Paid Online Events";
    case "paid_offline_event":
      return "Participated Paid In-Person Events";
    case "join_onton":
      return "Referred Users";
  }
}

export function getNotFoundTitle(type: UsersScoreActivityType) {
  switch (type) {
    case "free_online_event":
      return "Have not participated a free online event yet?";
    case "free_offline_event":
      return "Have not participated a free in-person event yet?";
    case "paid_online_event":
      return "Have not participated a paid online event yet?";
    case "paid_offline_event":
      return "Have not participated a paid in-person event yet?";
    case "join_onton":
      return "Have not referred any users yet?";
  }
}
