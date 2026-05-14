import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ikxilzhpzyrtzrrifiom.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy'; // Wait, I might need actual keys if they are not in .env, but I'll read backend/.env

async function testOMR() {
    try {
        // Read env for supabase directly
        const envStr = fs.readFileSync('.env', 'utf-8');
        let supaUrl = '';
        let supaKey = '';
        envStr.split('\n').forEach(line => {
            if (line.startsWith('SUPABASE_URL=')) supaUrl = line.split('=')[1].trim();
            if (line.startsWith('SUPABASE_SERVER_KEY=')) supaKey = line.split('=')[1].trim();
        });

        const supabase = createClient(supaUrl, supaKey);

        console.log("Logging in as teacher...");
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'taha@gmail.com',
            password: '12345678'
        });

        if (error) throw error;
        
        const token = data.session.access_token;
        console.log("Got token.");

        // 2. Prepare OMR Evaluation request
        const formData = new FormData();
        const answerKey = Array(20).fill('A'); // 20 questions, all A
        formData.append('answerKey', JSON.stringify(answerKey));
        formData.append('title', 'Test Script Evaluation');

        const imagePath = 'D:\\Projects\\checkmate-fyp\\services\\omr-checker\\OMRChecker\\samples\\sample1\\MobileCamera\\sheet1.jpg';
        formData.append('images', fs.createReadStream(imagePath));

        console.log("Sending OMR evaluation request...");
        const response = await axios.post('http://localhost:5000/api/omr/evaluate', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...formData.getHeaders()
            },
            timeout: 300000 // 5 minutes
        });

        console.log("--- SUCCESS ---");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("--- ERROR ---");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

testOMR();
