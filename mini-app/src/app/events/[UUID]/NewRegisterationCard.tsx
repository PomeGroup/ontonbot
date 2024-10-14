import { Cell, Switch } from "@telegram-apps/telegram-ui"

const NewRegisterationCard = () => {
    return (
        <Cell
            Component="label"
            after={<Switch defaultChecked />}
            description="When off, new participants can't register for the event."
            multiline
        >
            New Registeration
        </Cell>
    )
}

export default NewRegisterationCard