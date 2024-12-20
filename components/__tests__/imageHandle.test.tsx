import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageHandle from '../imagehandle'; // Correct the path if necessary

describe('ImageHandle Component', () => {
    test('should handle file selection and convert to base64', async () => {
        const fileContent = new Uint8Array([73, 72, 68, 82]);
        const file = new File([fileContent], 'test.png', { type: 'image/png' });

        const fileContent2 = new Uint8Array([255, 216, 255]);
        const file2 = new File([fileContent2], 'test2.jpg', { type: 'image/jpeg' });

        render(<ImageHandle />);

        const inputElement = screen.getByRole('textbox');
        fireEvent.change(inputElement, { target: { files: [file, file2] } });

        await waitFor(() => {
            expect(screen.getAllByRole('img').length).toBe(2);
        });

        const imageElements = screen.getAllByRole('img') as HTMLImageElement[];
        expect(imageElements[0].src).toMatch(/^data:image\/png;base64,/);
        expect(imageElements[1].src).toMatch(/^data:image\/jpeg;base64,/);

        const base64String = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });

        expect(imageElements[0].src).toEqual(base64String);

        const base64String2 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file2);
        });

        expect(imageElements[1].src).toEqual(base64String2);
    });

    test('should handle no file selected', () => {
        render(<ImageHandle />);
        const inputElement = screen.getByRole('textbox');
        fireEvent.change(inputElement, { target: { files: [] } });
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});