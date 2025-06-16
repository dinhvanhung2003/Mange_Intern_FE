import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    Autocomplete,
    Avatar,
    CircularProgress,
} from '@mui/material';
import api from '../../utils/axios';

interface InternProfile {
    name?: string;
    school?: string;
    major?: string;
    phone?: string;
    linkedinLink?: string;
    githubLink?: string;
    avatarUrl?: string;
}

interface University {
    name: string;
    country: string;
    domains: string[];
    web_pages: string[];
}

const InternProfileForm: React.FC = () => {
    const [form, setForm] = useState<InternProfile>({
        name: '',
        school: '',
        major: '',
        phone: '',
        linkedinLink: '',
        githubLink: '',
    });

    const [loading, setLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [universities, setUniversities] = useState<University[]>([]);

    useEffect(() => {
        api.get<InternProfile>('/interns/profile')
            .then((res) => {
                const avatarUrlWithTimestamp = res.data.avatarUrl
                    ? `${res.data.avatarUrl}?t=${Date.now()}`
                    : undefined;
                setForm({ ...res.data, avatarUrl: avatarUrlWithTimestamp });
            })
            .catch((err) => console.error('Lỗi khi tải hồ sơ:', err));

        fetch('http://localhost:3000/interns/vietnam')
            .then((res) => res.json())
            .then((data) => {
                const vietnamUnis = data.filter((u: University) => u.country === 'Vietnam');
                setUniversities(vietnamUnis);
            })
            .catch((err) => console.error('Lỗi load universities:', err));
    }, []);

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file); // ✅ Tên phải đúng

        setAvatarUploading(true);

        try {
            const token = sessionStorage.getItem('accessToken');
            const res = await fetch('http://localhost:3000/interns/avatar', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,

                },
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();

            if (data.avatarUrl) {
                setForm((prev) => ({
                    ...prev,
                    avatarUrl: `${data.avatarUrl}?t=${Date.now()}`
                }));
                alert('Cập nhật ảnh thành công!');
            }
        } catch (err) {
            console.error('Upload avatar lỗi:', err);
            alert('Lỗi khi upload avatar');
        } finally {
            e.target.value = '';
            setAvatarUploading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/interns/profile', form);
            alert('Cập nhật thành công!');
        } catch (err) {
            console.error('Lỗi cập nhật:', err);
            alert('Cập nhật thất bại!');
        }
        setLoading(false);
    };

    return (
        <Box maxWidth={600} mx="auto" p={4} boxShadow={3} borderRadius={2} bgcolor="white">
            <Typography variant="h5" mb={3} textAlign="center" color="primary">
                Chỉnh sửa hồ sơ cá nhân
            </Typography>

            <form onSubmit={handleSubmit}>
                <Box mb={2} textAlign="center">
                    {form.avatarUrl && (
                        <Avatar
                            src={`http://localhost:3000${form.avatarUrl}`}
                            sx={{ width: 100, height: 100, margin: 'auto' }}
                        />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={avatarUploading}
                    />
                    {avatarUploading && <CircularProgress size={20} sx={{ mt: 1 }} />}
                </Box>

                <TextField
                    fullWidth
                    label="Họ tên"
                    name="name"
                    value={form.name || ''}
                    onChange={handleInputChange}
                    margin="normal"
                />

                <Autocomplete
                    options={universities.map((u) => u.name)}
                    value={form.school || ''}
                    onChange={(event, newValue) => {
                        setForm((prev) => ({ ...prev, school: newValue || '' }));
                    }}
                    onInputChange={(event, newInputValue) => {
                        setForm((prev) => ({ ...prev, school: newInputValue }));
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Trường học" margin="normal" />
                    )}
                    freeSolo
                />

                <TextField
                    fullWidth
                    label="Chuyên ngành"
                    name="major"
                    value={form.major || ''}
                    onChange={handleInputChange}
                    margin="normal"
                />

                <TextField
                    fullWidth
                    label="Số điện thoại"
                    name="phone"
                    value={form.phone || ''}
                    onChange={handleInputChange}
                    margin="normal"
                />

                <TextField
                    fullWidth
                    label="LinkedIn"
                    name="linkedinLink"
                    value={form.linkedinLink || ''}
                    onChange={handleInputChange}
                    margin="normal"
                />

                <TextField
                    fullWidth
                    label="GitHub"
                    name="githubLink"
                    value={form.githubLink || ''}
                    onChange={handleInputChange}
                    margin="normal"
                />

                <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ mt: 2 }}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </form>
        </Box>
    );
};

export default InternProfileForm;
