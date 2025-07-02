import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";
import ManageEventCard from "../ManageEventCard";

const ManageEventCountry = () => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"country"}
          >
            Country
          </label>
          <Button
            variant="ghost"
            className="w-full flex-1 bg-brand-divider"
          >
            {/* Placeholder text */}
            <p className="text-[#8f8f90]">Your Event&apos;s Country</p>
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent
        title="Where the Event is held?"
        aria-label="Where the Event is held?"
      >
        <ScrollArea className="overflow-y-auto">
          <Tabs
            defaultValue="account"
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="account">In-person</TabsTrigger>
              <TabsTrigger value="password">Online</TabsTrigger>
            </TabsList>
            <TabsContent value="account">Make changes to your account here.</TabsContent>
            <TabsContent value="password">Change your password here.</TabsContent>
          </Tabs>
        </ScrollArea>

        <Button variant="primary">Submit</Button>
      </DrawerContent>
    </Drawer>
  );
};

const ManageEventCity = () => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"city"}
          >
            City
          </label>
          <Button
            variant="ghost"
            className="w-full flex-1 bg-brand-divider"
          >
            {/* Placeholder text */}
            <p className="text-[#8f8f90]">Your Event&apos;s City</p>
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent
        title="Where the Event is held?"
        aria-label="Where the Event is held?"
      >
        <ScrollArea className="overflow-y-auto">
          <Tabs
            defaultValue="account"
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="account">In-person</TabsTrigger>
              <TabsTrigger value="password">Online</TabsTrigger>
            </TabsList>
            <TabsContent value="account">Make changes to your account here.</TabsContent>
            <TabsContent value="password">Change your password here.</TabsContent>
          </Tabs>
        </ScrollArea>

        <Button variant="primary">Submit</Button>
      </DrawerContent>
    </Drawer>
  );
};

const ManageEventLocation = () => {
  return (
    <ManageEventCard title="Location">
      <Drawer>
        <DrawerTrigger asChild>
          <div>
            <label
              className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
              htmlFor={"hub"}
            >
              Event&apos;s Place
            </label>
            <Button
              variant="ghost"
              className="w-full flex-1 bg-brand-divider"
            >
              {/* Placeholder text */}
              <p className="text-[#8f8f90]">Select location</p>
              <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
            </Button>
          </div>
        </DrawerTrigger>
        <DrawerContent
          title="Where the Event is held?"
          aria-label="Where the Event is held?"
        >
          <ScrollArea className="overflow-y-auto">
            <Tabs
              defaultValue="in-person"
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="in-person">In-person</TabsTrigger>
                <TabsTrigger value="online">Online</TabsTrigger>
              </TabsList>
              <TabsContent
                value="in-person"
                className="flex flex-col gap-4 font-normal"
              >
                <ManageEventCountry />
                <ManageEventCity />
                <Input
                  label="Detail"
                  title="Your Event's Location Details"
                  name="address-info"
                  placeholder="Your Event's Location Details"
                  type="text"
                  info="Type info’s detail and choose it on the map so attendees can access easier"
                />
              </TabsContent>
              <TabsContent value="online">
                <Input
                  label="Event's Link"
                  title="Event's Link"
                  name="eventLink"
                  placeholder="Even location link"
                  type="text"
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <Button variant="primary">Submit</Button>
        </DrawerContent>
      </Drawer>
    </ManageEventCard>
  );
};

export default ManageEventLocation;
