import { useState } from "react";

export const useForm = ( initialForm = {} ) => {
    
    const [formState, setFormState] = useState( initialForm );

    const onInputChanged = ({ target }) => {
        const { name, value } = target

        setFormState({
            ...formState, 
            [ name ]: value
        })
    }

    const onResetForm = () => {
        setFormState( initialForm )
    }

    return({
        ...formState,
        onInputChanged,
        onResetForm,
    })

}