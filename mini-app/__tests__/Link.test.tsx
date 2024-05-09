import Link from "@/app/_components/Link";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

describe("Link", () => {
  it("renders a heading", () => {
    render(<Link link="https://example.com" />);

    const link = screen.getByText("https://example.com");

    expect(link).toBeInTheDocument();
  });
});
