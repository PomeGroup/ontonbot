'use client';

import Typography from "@/components/Typography"
import hardcodedAcl from "../hardcodedAcl"
import styles from './co-organizers.module.css';
import Image from "next/image";
import placeholderImage from './placeholder.svg'
import LoadableImage from "@/components/LoadableImage";
import { List as KonstaList, Button, Checkbox, Page, Popup, ListItem, Radio } from "konsta/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";
import { useDebouncedValue } from "@mantine/hooks";
import { OntonInput } from "@/components/OntonInput";
import { noop } from "lodash";

const extendedAcls = hardcodedAcl.map(item => ({
  ...item,
  active: true,
  avatar: 'https://t.me/i/userpic/320/ygszSob2tdeIJ6eV3WJ4j6ckUzPxjpI2UVdTopJVhn0.svg',
  username: 'radiophp'
}))

export default function CoOrganizersPage() {
  const eventData = {
    event_uuid: 'adfasdf'
  }
  // We probably need a separate endpoint to 
  // get the activation status, usernames, and avatars ONLY for this page.

  // const { data } = trpc.manageEvent.getAclData.useQuery(eventData.event_uuid)
  const [acl, setAcl] = useState(extendedAcls)
  // useEffect(() => {
  // if (!data) return
  // setAcl(data)
  // }, [data])

  const handleChange = (id: number, newActive: boolean) => {
    setAcl(prev => [...prev]
      .map(item => item.user_id === id ?
        ({ ...item, active: newActive }) : item
      ))
  }

  const mutateApi = useMutateAcl()
  const delayedAcl = useDebouncedValue(acl, 500)

  useEffect(() => {
    const update = async () => {
      try {
        await mutateApi.mutateAsync(eventData.event_uuid, delayedAcl)
        toast.success('Updates saved.')
      } catch (e) {
        console.error(e)
        toast.error('Failed to save the update.')
      }
    }

    update()
  }, [delayedAcl])

  const [addPopupOpen, setAddPopupOpen] = useState(false)

  const onAdd = (username: string, role: 'admin' | 'officer') => {

  }
  return (
    <div className='h-full flex flex-col overflow-hidden bg-[#EFEFF4] p-4'>
      <Typography
        className="mb-5"
        variant="title3"
        bold>
        Co-Organizers Management
      </Typography>
      <div className="grow">
        {acl.length === 0 ? (
          <EmptyList />
        ) : (
          <List data={acl} handleActiveChange={handleChange} />
        )}
      </div>
      <div className={styles.footer}>
        <Button
          className='rounded-[6px]'
          onClick={() => setAddPopupOpen(true)}>
          Add Co-organizer
        </Button>
      </div>
      <AddPopup
        open={addPopupOpen}
        onAdd={onAdd}
        onClose={() => setAddPopupOpen(false)}
      />
    </div>
  )
}

interface AddPopupProps {
  open: boolean
  onClose: () => void
  onAdd: (username: string, role: 'admin' | 'officer') => void
}

function AddPopup({ open, onAdd, onClose }: AddPopupProps) {
  const [username, setUsername] = useState('@')
  const [role, setRole] = useState<'admin' | 'officer'>('officer')

  const handleAdd = () => {
    onAdd(username, role)
  }
  return (
    <Popup opened={open}>
      <Page className="flex flex-col h-full justify- p-4">
        <Typography variant='title3' bold className='mb-3'>
          Add New User
        </Typography>
        <Typography variant='footnote' className='font-normal mb-2'>
          You can add other users as Co-Organizer so they can help you to manage an event more efficient.
        </Typography>
        <OntonInput
          label="Telegram ID"
          value={username}
          onChange={e => setUsername((e.target as any).value)} />
        <KonstaList strongIos outlineIos>
          <ListItem
            label
            title="Admin"
            media={
              <Radio
                component="div"
                value="admin"
                checked={role === 'admin'}
                onChange={() => setRole('admin')}
              />
            }
          />
          <ListItem
            label
            title="Officer"
            media={
              <Radio
                component="div"
                value="officer"
                checked={role === 'officer'}
                onChange={() => setRole('officer')}
              />
            }
          />
        </KonstaList>
        <div className='mt-auto p-3'>
          <Button className='py-3 mb-3 rounded-[10px]' onClick={handleAdd}>Save</Button>
          <Button outlined className='py-3 rounded-[10px]' onClick={onClose}>Cancel</Button>
        </div>
      </Page>
    </Popup>
  )
}

function EmptyList() {
  return (
    <div className={styles.emptyList}>
      <Image src={placeholderImage} width={1943} height={141.6} alt='' />
      <div className={styles['emptyList-helper']}>
        <div>
          <Typography
            variant='subheadline2'
            bold
            className='mb-2'>
            No one added as Co-Organizer!
          </Typography>
          <Typography
            variant='subheadline2'
            className='font-medium text-[#8e8e93]'>
            You can add users as:
          </Typography>
        </div>
        <div>
          <Typography
            variant='subheadline2'
            bold
            className='mb-2 text-[#ff9500]'>
            Admin
          </Typography>
          <Typography
            variant='subheadline2'
            className='font-medium text-[#8e8e93]'>
            Can access and manage guests list
          </Typography>
        </div>
        <div>
          <Typography
            variant='subheadline2'
            bold
            className='mb-2 text-[#34C759]'>
            Check-in Officer
          </Typography>
          <Typography
            variant='subheadline2'
            className='font-medium text-[#8e8e93]'>
            Can access and manage guests list
          </Typography>
        </div>
      </div>
    </div>
  )
}

type ChangeHandler = (id: number, checked: boolean) => void

function List({ data, handleActiveChange }: { handleActiveChange: ChangeHandler, data: typeof extendedAcls }) {
  return data.map((item) => (
    <CoOrganizerCard
      data={item}
      key={item.user_id}
      onChange={handleActiveChange}
    />
  ))
}

interface CoOrganizerCardProps {
  onChange: ChangeHandler
  data: typeof extendedAcls[0]
}

function CoOrganizerCard({ data, onChange }: CoOrganizerCardProps) {
  return (
    <div className={styles['listItem']}>
      <LoadableImage
        src={data.avatar}
        className={styles['listItem-avatar']}
        width={48}
        height={48} />
      <div className={styles['listItem-data']}>
        <div className='text-[18px] font-medium'>
          Test Coorganizer
        </div>
        <div
          className={data.role === 'admin' ?
            styles['listItem-role--admin'] :
            styles['listItem-role--officer']}>
          {data.role}
        </div>
      </div>
      <Checkbox
        checked={true}
        onChange={e => onChange(data.user_id, e.target.checked)} />
    </div>
  )
}

function useMutateAcl() {
  return { mutateAsync: noop } //trpc.manageEvent.updateAcl.useMutation()
}
