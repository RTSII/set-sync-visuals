-- Create storage bucket for proxy videos
INSERT INTO storage.buckets (id, name, public) VALUES ('proxy-videos', 'proxy-videos', true);

-- Create storage bucket for original videos  
INSERT INTO storage.buckets (id, name, public) VALUES ('original-videos', 'original-videos', false);

-- Create policies for proxy videos (public access for performance)
CREATE POLICY "Proxy videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'proxy-videos');

CREATE POLICY "Users can upload proxy videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'proxy-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their proxy videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'proxy-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their proxy videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'proxy-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for original videos (private access)
CREATE POLICY "Users can view their own original videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'original-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their original videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'original-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their original videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'original-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their original videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'original-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create media assets table to track proxy relationships
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_file_path TEXT NOT NULL,
  proxy_file_path TEXT,
  original_resolution TEXT,
  proxy_resolution TEXT DEFAULT '720p',
  original_size INTEGER,
  proxy_size INTEGER,
  duration FLOAT,
  framerate FLOAT,
  codec_info JSONB,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for media assets
CREATE POLICY "Users can view their own media assets" 
ON public.media_assets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own media assets" 
ON public.media_assets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media assets" 
ON public.media_assets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media assets" 
ON public.media_assets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_media_assets_user_id ON public.media_assets(user_id);
CREATE INDEX idx_media_assets_processing_status ON public.media_assets(processing_status);
CREATE INDEX idx_media_assets_created_at ON public.media_assets(created_at DESC);