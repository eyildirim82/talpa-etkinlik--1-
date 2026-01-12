import { EventData, User } from '@/types';

// Mock Event Data - Multiple Events
export const mockEvents: EventData[] = [
    {
        id: 1,
        title: 'TALPA Yıl Sonu Kokteyl & Networking Etkinliği',
        description: 'Değerli üyelerimiz, 2025 yılını kutlamak ve havacılık camiası olarak bir araya gelmek için düzenlediğimiz özel kokteyl etkinliğimize davetlisiniz.',
        location: 'İstanbul Havacılık Kulübü - Yeşilköy',
        event_date: '2025-12-31T19:00:00',
        total_quota: 150,
        remaining_stock: 87,
        price: 500,
        currency: 'TL',
        is_active: true,
        image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=700&fit=crop',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        title: 'CMXXIV Stand-up Gösterisi',
        description: 'Eğlenceli bir akşam için CMXXIV ile stand-up gösterisine bekliyoruz.',
        location: 'İstanbul Kültür Merkezi',
        event_date: '2025-03-10T20:00:00',
        total_quota: 200,
        remaining_stock: 0,
        price: 350,
        currency: 'TL',
        is_active: false,
        image_url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&h=700&fit=crop',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        title: 'BORUSAN İSTANBUL FİLARMONİ ORKESTRASI KONSERİ',
        description: 'Klasik müziğin büyülü atmosferinde unutulmaz bir gece.',
        location: 'Cemal Reşit Rey Konser Salonu',
        event_date: '2025-06-26T20:00:00',
        total_quota: 300,
        remaining_stock: 0,
        price: 600,
        currency: 'TL',
        is_active: false,
        image_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&h=700&fit=crop',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        title: 'Dünya Pilotlar Günü Balosu',
        description: 'Pilotlar Günü özel balo gecesine tüm üyelerimiz davetlidir.',
        location: 'Lütfi Kırdar Kongre Merkezi',
        event_date: '2025-04-27T19:00:00',
        total_quota: 250,
        remaining_stock: 0,
        price: 750,
        currency: 'TL',
        is_active: false,
        image_url: 'https://images.unsplash.com/photo-1519167758481-83f29da8dd8f?w=1200&h=700&fit=crop',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        title: 'SAATLERİ AYARLAMA ENSTİTÜSÜ',
        description: 'Ünlü tiyatro oyunu Saatleri Ayarlama Enstitüsü gösteriminde yerinizi ayırtın.',
        location: 'Zorlu PSM',
        event_date: '2025-02-15T19:30:00',
        total_quota: 180,
        remaining_stock: 0,
        price: 400,
        currency: 'TL',
        is_active: false,
        image_url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=700&fit=crop',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 6,
        title: 'AFİFE TİYATRO',
        description: 'Türk tiyatrosunun öncüsü Afife Jale\'nin hikayesi sahnede.',
        location: 'İstanbul Devlet Tiyatrosu',
        event_date: '2024-12-03T19:30:00',
        total_quota: 150,
        remaining_stock: 0,
        price: 350,
        currency: 'TL',
        is_active: false,
        image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&h=700&fit=crop',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// Mock User Data
export const mockUser: User = {
    id: 'mock-user-001',
    full_name: 'Ahmet Yılmaz',
    talpa_sicil_no: 'TALPA-2024-1234',
    is_admin: false,
    phone: '+90 532 123 4567',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

// Function to simulate async data loading
export const loadMockData = async (): Promise<{ events: EventData[]; user: User | null }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
        events: mockEvents,
        user: mockUser
    };
};
