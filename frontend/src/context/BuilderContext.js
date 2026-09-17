import React, { createContext, useState, useContext } from 'react';
import { api, endpoints } from '../api/endpoints';

const BuilderContext = createContext();

export const useBuilder = () => useContext(BuilderContext);

export const BuilderProvider = ({ children }) => {
    // Стан обраних компонентів
    const [selectedComponents, setSelectedComponents] = useState({
        cpu: null,
        motherboard: null,
        ram: null,
        gpu: null,
        psu: null
    });

    const [validationResult, setValidationResult] = useState(null);

    // --- ОСЬ ТУТ БУЛА ПРОБЛЕМА. ВИПРАВЛЕНА ВЕРСІЯ: ---
    const selectComponent = (category, item) => {
        // 1. Перевіряємо, чи цей товар вже обраний в цій категорії
        const isAlreadySelected = selectedComponents[category]?.id === item.id;

        // 2. Якщо вже обраний -> ставимо null (видаляємо). 
        //    Якщо ні -> ставимо item (обираємо).
        const newItem = isAlreadySelected ? null : item;

        // 3. Оновлюємо стан
        const newState = { ...selectedComponents, [category]: newItem };
        setSelectedComponents(newState);

        // 4. Запускаємо перевірку сумісності
        validateBuild(newState);
    };
    // ----------------------------------------------------

    const validateBuild = async (currentSelection) => {
        const ids = Object.values(currentSelection)
            .filter(item => item !== null)
            .map(item => item.id);

        if (ids.length === 0) {
            setValidationResult(null);
            return;
        }

        try {
            const response = await api.post(endpoints.builder.validate, {
                component_ids: ids
            });
            setValidationResult(response.data);
        } catch (error) {
            console.error("Помилка перевірки:", error);
        }
    };

    return (
        <BuilderContext.Provider value={{
            selectedComponents,
            selectComponent,
            validationResult
        }}>
            {children}
        </BuilderContext.Provider>
    );
};