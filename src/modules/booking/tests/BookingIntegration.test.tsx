import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingModal } from '../components/BookingModal';
import { vi } from 'vitest';

// Mocks
const mockMutateAsync = vi.fn();
const mockUseJoinEvent = {
    mutateAsync: mockMutateAsync,
    isPending: false,
};

vi.mock('../hooks/useBooking', () => ({
    useJoinEvent: () => mockUseJoinEvent,
}));

const mockUser = {
    id: '123',
    full_name: 'Test User',
    email: 'test@example.com',
};

const mockUseProfile = {
    user: mockUser,
};

vi.mock('@/modules/profile', () => ({
    useProfile: () => mockUseProfile,
}));

describe('BookingIntegration', () => {
    const defaultProps = {
        eventId: 1,
        eventPrice: 100,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseProfile.user = mockUser; // Reset user
        mockUseJoinEvent.isPending = false;
    });

    it('renders correctly with logged in user', () => {
        render(<BookingModal {...defaultProps} />);
        expect(screen.getByText(/Sayın/)).toHaveTextContent('Test User');
        expect(screen.getByText(/ön kayıt yaptırmak üzeresiniz/)).toBeInTheDocument();
    });

    it('shows error when user is not logged in', () => {
        mockUseProfile.user = null as any; // Simulate logged out
        render(<BookingModal {...defaultProps} />);
        expect(screen.getByText(/Giriş yapmamış görünüyorsunuz/)).toBeInTheDocument();
    });

    it('disables submit button initially', () => {
        render(<BookingModal {...defaultProps} />);
        const submitBtn = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i });
        expect(submitBtn).toBeDisabled();
    });

    it('enables submit button only after consents are checked', () => {
        render(<BookingModal {...defaultProps} />);
        const submitBtn = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i });
        const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i);
        const paymentCheckbox = screen.getByLabelText(/Mesafeli Satış Sözleşmesi/i);

        fireEvent.click(kvkkCheckbox);
        expect(submitBtn).toBeDisabled();

        fireEvent.click(paymentCheckbox);
        expect(submitBtn).toBeEnabled();
    });

    it('submits form with correct data', async () => {
        mockMutateAsync.mockResolvedValue({ success: true, queue: { status: 'waiting' } });
        render(<BookingModal {...defaultProps} />);

        const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i);
        const paymentCheckbox = screen.getByLabelText(/Mesafeli Satış Sözleşmesi/i);
        const submitBtn = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i });

        fireEvent.click(kvkkCheckbox);
        fireEvent.click(paymentCheckbox);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                eventId: 1,
                consentKvkk: true,
                consentPayment: true,
            });
        });

        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('displays error message on submission failure', async () => {
        mockMutateAsync.mockResolvedValue({ success: false, message: 'Server error' });
        render(<BookingModal {...defaultProps} />);

        const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i);
        const paymentCheckbox = screen.getByLabelText(/Mesafeli Satış Sözleşmesi/i);
        const submitBtn = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i });

        fireEvent.click(kvkkCheckbox);
        fireEvent.click(paymentCheckbox);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });
    });
});
