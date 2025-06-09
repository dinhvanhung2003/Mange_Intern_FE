import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import {
    TextField,
    MenuItem,
    Button,
    Box,
    Typography,
    Autocomplete,
} from '@mui/material';
import api from '../../utils/axios';

interface InternProfile {
    name?: string;
    school?: string;
    major?: string;
    phone?: string;
    linkedinLink?: string;
    githubLink?: string;
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
    const [universities, setUniversities] = useState<University[]>([]);

    useEffect(() => {
        // Load profile
        api
            .get<InternProfile>('/interns/profile')
            .then((res) => setForm(res.data))
            .catch((err) => console.error('Lỗi khi tải hồ sơ:', err));

        // Load university list
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
                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="Họ tên"
                        name="name"
                        value={form.name || ''}
                        onChange={handleInputChange}
                    />
                </Box>

                <Box mb={2}>
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
                            <TextField {...params} label="Trường học" variant="outlined" />
                        )}
                        freeSolo
                    />

                </Box>

                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="Chuyên ngành"
                        name="major"
                        value={form.major || ''}
                        onChange={handleInputChange}
                    />
                </Box>

                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="Số điện thoại"
                        name="phone"
                        value={form.phone || ''}
                        onChange={handleInputChange}
                    />
                </Box>

                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="LinkedIn"
                        name="linkedinLink"
                        value={form.linkedinLink || ''}
                        onChange={handleInputChange}
                    />
                </Box>

                <Box mb={2}>
                    <TextField
                        fullWidth
                        label="GitHub"
                        name="githubLink"
                        value={form.githubLink || ''}
                        onChange={handleInputChange}
                    />
                </Box>

                <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
            </form>
        </Box>
    );
};

export default InternProfileForm;
