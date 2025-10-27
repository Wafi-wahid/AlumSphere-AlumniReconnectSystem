import { useState } from "react";
import { Heart, MessageCircle, Share2, Send, Image, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const mockPosts = [
  {
    id: 1,
    author: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    role: "Senior Software Engineer at Google",
    time: "2 hours ago",
    content: "Excited to announce that I'll be hosting a webinar on 'Breaking into Tech' next week! Looking forward to sharing my journey and answering your questions. 🚀",
    likes: 47,
    comments: 12,
    shares: 5,
    badges: ["Top Mentor", "Class of 2018"]
  },
  {
    id: 2,
    author: "Michael Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    role: "Product Manager at Microsoft",
    time: "5 hours ago",
    content: "Just wrapped up an amazing mentorship session with some brilliant students. The future is bright! If you're looking for product management guidance, feel free to reach out.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
    likes: 89,
    comments: 23,
    shares: 8,
    badges: ["Alumni Mentor"]
  },
  {
    id: 3,
    author: "Emily Davis",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    role: "Engineering Manager at Tesla",
    time: "1 day ago",
    content: "We're hiring! Tesla is looking for talented engineers. Alumni get priority in our referral program. DM me if you're interested! 💼⚡",
    likes: 124,
    comments: 34,
    shares: 45,
    badges: ["Event Speaker", "Class of 2016"]
  }
];

export function CommunityPage() {
  const [posts, setPosts] = useState(mockPosts);
  const [newPost, setNewPost] = useState("");

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const newPostObj = {
        id: Date.now(),
        author: "You",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        role: "Student",
        time: "Just now",
        content: newPost,
        likes: 0,
        comments: 0,
        shares: 0,
        badges: ["Student"]
      };
      setPosts([newPostObj, ...posts]);
      setNewPost("");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <p className="text-muted-foreground">
          Stay connected with the alumni community
        </p>
      </div>

      {/* Create Post */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Share something with the community..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="ghost">
                <Image className="h-4 w-4 mr-2" />
                Photo
              </Button>
              <Button size="sm" variant="ghost">
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button size="sm" variant="ghost">
                <FileText className="h-4 w-4 mr-2" />
                Article
              </Button>
            </div>
            <Button size="sm" onClick={handleCreatePost}>
              <Send className="h-4 w-4 mr-2" />
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-4">
              {/* Post Header */}
              <div className="flex gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.avatar} alt={post.author} />
                  <AvatarFallback>{post.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{post.author}</h3>
                    {post.badges.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{post.role}</p>
                  <p className="text-xs text-muted-foreground">{post.time}</p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-sm leading-relaxed">{post.content}</p>

              {/* Post Image */}
              {post.image && (
                <img 
                  src={post.image} 
                  alt="Post content" 
                  className="rounded-lg w-full object-cover max-h-96"
                />
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">{post.shares}</span>
                  </Button>
                </div>
              </div>

              {/* Comment Input */}
              <div className="flex gap-3 pt-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                  <AvatarFallback>YO</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Textarea 
                    placeholder="Write a comment..." 
                    className="min-h-[60px] resize-none"
                  />
                  <Button size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
