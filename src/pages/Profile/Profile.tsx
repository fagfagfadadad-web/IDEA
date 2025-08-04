import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Avatar,
  Flex,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  HStack,
  Progress,
  SimpleGrid,
  Image,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
  Tooltip,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { EmailNotificationsToggle } from '../../components';
import { MoreVertical, Plus, Star, X, Edit2, Clock, DollarSign, Coins } from 'lucide-react';
import { TwitterShareButton } from '../components/TwitterShareButton';
import { useDeleteGig } from '../hooks/useGigs';
import { usePayments } from '../hooks/usePayments';
import { useWindowSize } from '../hooks/useWindowSize';
import { supabase } from '../lib/supabase';

export const Profile = () => {
  const { id } = useParams();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile(id || user?.id);
  const updateProfile = useUpdateProfile();
  const deleteGig = useDeleteGig();
  const { claimPayment } = usePayments();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [gigToDelete, setGigToDelete] = useState<string | null>(null);
  const [deletedGigIds, setDeletedGigIds] = useState<string[]>([]);
  const [timeLeftMap, setTimeLeftMap] = useState<Record<string, string>>({});
  
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    bio: '',
  });

  // Check if we're still loading authentication or profile data
  const isLoading = authLoading || profileLoading;

  // Countdown timer for orders
  useEffect(() => {
    const updateTimeLeft = () => {
      if (profile?.orders) {
        const newTimeLeftMap: Record<string, string> = {};
        
        profile.orders.forEach((order: any) => {
          // For pending_release orders, calculate time until claimable
          if (order.payment_status === 'pending_release' && order.release_at) {
            const now = new Date();
            const releaseTime = new Date(order.release_at);
            const timeDiff = releaseTime.getTime() - now.getTime();
            
            if (timeDiff > 0) {
              const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
              
              if (days > 0) {
                newTimeLeftMap[order.id] = `${days}d ${hours}h ${minutes}m`;
              } else if (hours > 0) {
                newTimeLeftMap[order.id] = `${hours}h ${minutes}m`;
              } else {
                newTimeLeftMap[order.id] = `${minutes}m`;
              }
            } else {
              newTimeLeftMap[order.id] = 'Ready to claim';
            }
          }
        });
        
        setTimeLeftMap(newTimeLeftMap);
      }
    };
    
    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [profile?.orders]);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  // Real-time subscription for gigs
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('public:gigs')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'gigs',
          filter: `provider_id=eq.${user.id}`,
        },
        (payload) => {
          setDeletedGigIds(prev => [...prev, payload.old.id]);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [refetch, user?.id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const orderId = searchParams.get('order');

    if (tab === 'orders' && orderId) {
      navigate(`/orders/${orderId}`);
    }
  }, [searchParams, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
      toast({
        title: 'Profile updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, gigId: string) => {
    e.stopPropagation();
    setGigToDelete(gigId);
    onDeleteAlertOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!gigToDelete) {
      return;
    }

    try {
      await deleteGig.mutateAsync(gigToDelete, {
        onSuccess: async () => {
          setDeletedGigIds(prev => [...prev, gigToDelete]);
          await refetch();
        },
      });
      toast({
        title: 'Gig deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting gig',
        description: error instanceof Error ? error.message : 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGigToDelete(null);
      onDeleteAlertClose();
    }
  };

  const handleEditClick = (e: React.MouseEvent, gigId: string) => {
    e.stopPropagation();
    navigate(`/gigs/${gigId}/edit`);
  };

  const handleClaimPayment = async (orderId: string) => {
    try {
      await claimPayment(orderId);
      toast({
        title: 'Payment claimed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to claim payment',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#01c3a8';
      case 'in_progress':
        return '#1890ff';
      case 'cancelled':
        return '#a63d2a';
      default:
        return '#ffb741';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 50;
      case 'cancelled':
        return 100;
      default:
        return 25;
    }
  };

  const getPaymentStatusBadge = (order: any) => {
    if (order.payment_status === 'pending_release') {
      const canClaim = order.release_at && new Date(order.release_at) <= new Date();
      return (
        <Badge
          colorScheme={canClaim ? "green" : "yellow"}
          display="flex"
          alignItems="center"
          gap={1}
          position="absolute"
          top={2}
          left={2}
          zIndex={2}
          fontSize="xs"
          px={2}
          py={1}
        >
          {canClaim ? <DollarSign size={10} /> : <Clock size={10} />}
          {canClaim ? 'Ready to claim' : `Available in ${timeLeftMap[order.id] || 'calculating...'}`}
        </Badge>
      );
    }
    return null;
  };

  const getClaimButton = (order: any) => {
    const isProvider = order.gig?.provider_id === user?.id || 
                      (order.provider_address && order.provider_address === user?.wallet_address);
                      
    const canClaim = order.payment_status === 'pending_release' && 
                     order.release_at && 
                     new Date(order.release_at) <= new Date() &&
                     isProvider;

    if (isProvider && order.payment_status === 'pending_release') {
      if (canClaim) {
        return (
          <Tooltip label="Payment is ready to be claimed">
            <Button
              colorScheme="green"
              size="sm"
              leftIcon={<DollarSign size={12} />}
              onClick={() => handleClaimPayment(order.id)}
            >
              Claim {order.amount} {order.payment_token || 'EGLD'}
            </Button>
          </Tooltip>
        );
      } else {
        return (
          <Tooltip label={`Payment will be available in ${timeLeftMap[order.id] || 'calculating...'}`}>
            <Button
              colorScheme="yellow"
              size="sm"
              leftIcon={<Clock size={12} />}
              isDisabled
            >
              {timeLeftMap[order.id] || 'calculating...'}
            </Button>
          </Tooltip>
        );
      }
    } else {
      // For non-providers or orders not in pending_release state
      return (
        <Text
          bg="gray.100"
          color="gray.800"
          borderRadius="full"
          px={3}
          py={1}
          fontSize="xs"
        >
          {order.amount} {order.payment_token || 'EGLD'}
        </Text>
      );
    }
  };

  // Show loading spinner while authentication or profile is loading
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box bg="white" p={8} borderRadius="xl" shadow="md">
          <Center>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color="gray.800" fontSize="lg">
                {authLoading ? 'Setting up your profile...' : 'Loading profile data...'}
              </Text>
              <Text color="gray.600" fontSize="sm">
                Please wait while we prepare everything for you
              </Text>
            </VStack>
          </Center>
        </Box>
      </Container>
    );
  }

  // Calculate statistics
  const completedOrders = profile?.orders?.filter(order => order.status === 'completed') || [];
  const totalEarnings = completedOrders.reduce((sum, order) => sum + Number(order.amount), 0);
  const reviews = completedOrders.flatMap(order => order.reviews || []);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  // Filter out deleted gigs client-side
  const filteredGigs = profile?.gigs?.filter(gig => !deletedGigIds.includes(gig.id)) || [];

  if (!profile) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box bg="white" p={8} borderRadius="xl" shadow="md">
          <Text color="gray.800">Profile not found</Text>
        </Box>
      </Container>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  if (isMobile) {
    // Mobile Layout - Light Theme
    return (
      <Container maxW="container.xl" py={4} px={4}>
        {/* Profile Header - Mobile */}
        <Box bg="white" p={4} borderRadius="xl" shadow="md" mb={4}>
          <Flex gap={3} align="center" mb={3}>
            <Avatar
              size="md"
              name={profile?.full_name || profile?.username}
              src={profile?.avatar_url}
            />
            <VStack align="flex-start" spacing={0.5}>
              <Heading size="sm" color="gray.800">{profile?.full_name || profile?.username}</Heading>
              <Text color="gray.600" fontSize="sm">Web3 Developer</Text>
              <Text color="blue.600" fontSize="xs">
                Member since {new Date(profile.created_at!).toLocaleDateString()}
              </Text>
            </VStack>
          </Flex>

          <Text color="gray.700" mb={3} fontSize="sm">
            {profile?.bio || 'No bio yet'}
          </Text>

          {isOwnProfile && (
            <Button
              onClick={onOpen}
              variant="outline"
              borderColor="blue.500"
              color="blue.500"
              _hover={{ bg: 'blue.50' }}
              size="sm"
            >
              Edit Profile
            </Button>
          )}
        </Box>

        {/* Statistics Section - Mobile */}
        <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={4}>
          <Box bg="white" p={3} borderRadius="lg" shadow="sm" textAlign="center">
            <DollarSign size={20} color="#10B981" style={{ margin: '0 auto 8px' }} />
            <Text color="gray.600" fontSize="xs">Total Earned</Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {totalEarnings}
            </Text>
            <Text fontSize="xs" color="gray.500">EGLD</Text>
          </Box>

          <Box bg="white" p={3} borderRadius="lg" shadow="sm" textAlign="center">
            <Box as="span" fontSize="20px" color="#3B82F6" display="block" mb={2}>📊</Box>
            <Text color="gray.600" fontSize="xs">Completed</Text>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              {completedOrders.length}
            </Text>
            <Text fontSize="xs" color="gray.500">Gigs</Text>
          </Box>

          <Box bg="white" p={3} borderRadius="lg" shadow="sm" textAlign="center">
            <Star size={20} color="#F59E0B" fill="#F59E0B" style={{ margin: '0 auto 8px' }} />
            <Text color="gray.600" fontSize="xs">Rating</Text>
            <Text fontSize="lg" fontWeight="bold" color="yellow.600">
              {averageRating}
            </Text>
            <Text fontSize="xs" color="gray.500">Average</Text>
          </Box>
        </Grid>

        {/* Tabbed Content - Mobile */}
        <Box bg="white" borderRadius="xl" shadow="md" overflow="hidden">
          <Tabs variant="unstyled" colorScheme="blue">
            <TabList 
              bg="gray.50" 
              overflowX="auto" 
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              <Tab
                fontSize="sm"
                px={4}
                py={3}
                minW="auto"
                whiteSpace="nowrap"
                color="gray.600"
                fontWeight="medium"
                _selected={{
                  color: 'blue.600',
                  bg: 'white',
                  borderBottom: '2px solid',
                  borderColor: 'blue.600',
                }}
                _hover={{
                  color: 'blue.600',
                }}
              >
                My Gigs
              </Tab>
              {isOwnProfile && (
                <Tab
                  fontSize="sm"
                  px={4}
                  py={3}
                  minW="auto"
                  whiteSpace="nowrap"
                  color="gray.600"
                  fontWeight="medium"
                  _selected={{
                    color: 'blue.600',
                    bg: 'white',
                    borderBottom: '2px solid',
                    borderColor: 'blue.600',
                  }}
                  _hover={{
                    color: 'blue.600',
                  }}
                >
                  My Orders
                </Tab>
              )}
              <Tab
                fontSize="sm"
                px={4}
                py={3}
                minW="auto"
                whiteSpace="nowrap"
                color="gray.600"
                fontWeight="medium"
                _selected={{
                  color: 'blue.600',
                  bg: 'white',
                  borderBottom: '2px solid',
                  borderColor: 'blue.600',
                }}
                _hover={{
                  color: 'blue.600',
                }}
              >
                Reviews
              </Tab>
              {isOwnProfile && (
                <Tab
                  fontSize="sm"
                  px={4}
                  py={3}
                  minW="auto"
                  whiteSpace="nowrap"
                  color="gray.600"
                  fontWeight="medium"
                  _selected={{
                    color: 'blue.600',
                    bg: 'white',
                    borderBottom: '2px solid',
                    borderColor: 'blue.600',
                  }}
                  _hover={{
                    color: 'blue.600',
                  }}
                >
                  Settings
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* My Gigs Tab - Mobile */}
              <TabPanel p={4}>
                <VStack spacing={4} align="stretch">
                  {filteredGigs.length ? (
                    filteredGigs.map((gig, index) => {
                      const statusColor = getStatusColor(gig.category.toLowerCase());
                      const paymentToken = gig.payment_token || 'EGLD';
                      const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                      const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;

                      return (
                        <Box
                          key={`${gig.id}-${index}`}
                          bg="white"
                          borderRadius="lg"
                          shadow="md"
                          overflow="hidden"
                          border="1px solid"
                          borderColor="gray.200"
                          _hover={{
                            shadow: 'lg',
                            transform: 'translateY(-2px)',
                          }}
                          transition="all 0.2s"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                          cursor="pointer"
                        >
                          {/* Gig Header */}
                          <Flex justify="space-between" align="center" p={3} borderBottom="1px solid" borderColor="gray.100">
                            <Text color="gray.500" fontSize="xs">
                              {new Date(gig.created_at).toLocaleDateString()}
                            </Text>
                            <Badge
                              colorScheme="blue"
                              fontSize="xs"
                              px={2}
                              py={1}
                            >
                              {gig.category}
                            </Badge>
                          </Flex>

                          {/* Gig Image */}
                          <Box position="relative" h="120px">
                            <Image
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              objectFit="cover"
                              w="100%"
                              h="100%"
                            />
                          </Box>

                          {/* Gig Content */}
                          <Box p={3}>
                            <Heading size="sm" color="gray.800" mb={2} noOfLines={2}>
                              {gig.title}
                            </Heading>
                            <Text color="gray.600" fontSize="sm" mb={3} noOfLines={2}>
                              {gig.description}
                            </Text>
                            <Text color="gray.700" fontSize="sm" mb={3}>
                              Duration: {gig.duration} days
                            </Text>
                            
                            {/* Price and Actions */}
                            <Flex justify="space-between" align="center">
                              <HStack>
                                {tokenIcon}
                                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                                  {gig.price} {tokenSymbol}
                                </Text>
                              </HStack>
                              
                              {isOwnProfile && (
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<Edit2 size={16} />}
                                    aria-label="Edit gig"
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={(e) => handleEditClick(e, gig.id)}
                                  />
                                  <IconButton
                                    icon={<X size={16} />}
                                    aria-label="Delete gig"
                                    size="sm"
                                    colorScheme="red"
                                    variant="outline"
                                    onClick={(e) => handleDeleteClick(e, gig.id)}
                                  />
                                </HStack>
                              )}
                            </Flex>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Text color="gray.600" textAlign="center" py={8}>No active gigs yet</Text>
                  )}
                </VStack>
              </TabPanel>

              {/* My Orders Tab - Mobile */}
              {isOwnProfile && (
                <TabPanel p={4}>
                  <VStack spacing={4} align="stretch">
                    {profile?.orders?.length ? (
                      profile.orders.map((order, index) => {
                        const statusColor = getStatusColor(order.status);
                        const progressValue = getProgressValue(order.status);

                        return (
                          <Box
                            key={`${order.id}-${index}`}
                            bg="white"
                            borderRadius="lg"
                            shadow="md"
                            overflow="hidden"
                            border="1px solid"
                            borderColor="gray.200"
                            position="relative"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            cursor="pointer"
                          >
                            {getPaymentStatusBadge(order)}

                            <Box p={4}>
                              <Flex justify="space-between" align="center" mb={3}>
                                <Text color="gray.500" fontSize="xs">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </Text>
                                <Badge colorScheme="blue" fontSize="xs">
                                  {order.status}
                                </Badge>
                              </Flex>

                              <Heading size="sm" color="gray.800" mb={2}>
                                {order.gig?.title || "Custom Project"}
                              </Heading>
                              
                              <Text color="gray.600" fontSize="xs" mb={3}>
                                Order #{order.id.slice(0, 8)}
                              </Text>

                              {/* Progress */}
                              <Box mb={3}>
                                <Text color="gray.700" fontSize="xs" mb={1}>Progress</Text>
                                <Progress
                                  value={progressValue}
                                  colorScheme="blue"
                                  size="sm"
                                  bg="gray.200"
                                />
                                <Text color="gray.600" fontSize="xs" textAlign="right" mt={1}>
                                  {progressValue}%
                                </Text>
                              </Box>

                              <Flex justify="space-between" align="center">
                                <HStack>
                                  <Avatar size="xs" name={order.client?.username} src={order.client?.avatar_url} />
                                  <Text color="gray.600" fontSize="xs">Client</Text>
                                </HStack>
                                {getClaimButton(order)}
                              </Flex>
                            </Box>
                          </Box>
                        );
                      })
                    ) : (
                      <Text color="gray.600" textAlign="center" py={8}>No orders yet</Text>
                    )}
                  </VStack>
                </TabPanel>
              )}

              {/* Reviews Tab - Mobile */}
              <TabPanel p={4}>
                <VStack spacing={4} align="stretch">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <Box
                        key={`${review.id}-${index}`}
                        bg="white"
                        p={4}
                        borderRadius="lg"
                        shadow="sm"
                        border="1px solid"
                        borderColor="gray.200"
                      >
                        <Flex justify="space-between" align="center" mb={3}>
                          <HStack>
                            <Avatar
                              size="xs"
                              name={review.order?.client?.username}
                              src={review.order?.client?.avatar_url}
                            />
                            <VStack align="start" spacing={0}>
                              <Text color="gray.800" fontWeight="medium" fontSize="sm">
                                {review.order?.client?.username}
                              </Text>
                              <Text color="gray.500" fontSize="xs">
                                {new Date(review.created_at).toLocaleDateString()}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack>
                            {Array(5)
                              .fill('')
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  fill={i < review.rating ? '#F59E0B' : 'none'}
                                  color={i < review.rating ? '#F59E0B' : '#D1D5DB'}
                                />
                              ))}
                          </HStack>
                        </Flex>

                        <Text color="gray.600" fontSize="xs" mb={1}>
                          Order: {review.order?.gig?.title}
                        </Text>
                        <Text color="gray.800" fontSize="sm">{review.comment}</Text>
                      </Box>
                    ))
                  ) : (
                    <Text color="gray.600" textAlign="center" py={8}>No reviews yet</Text>
                  )}
                </VStack>
              </TabPanel>

              {/* Settings Tab - Mobile */}
              {isOwnProfile && (
                <TabPanel p={4}>
                  <Box bg="gray.50" p={4} borderRadius="lg">
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm" color="gray.800" mb={2}>
                        Notification Settings
                      </Heading>
                      <EmailNotificationsToggle enabled={profile?.email_notifications_enabled ?? true} />
                    </VStack>
                  </Box>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </Box>

        {/* Edit Profile Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent bg="white">
            <ModalHeader color="gray.800">Edit Profile</ModalHeader>
            <ModalCloseButton color="gray.600" />
            <ModalBody pb={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel color="gray.700">Username</FormLabel>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      bg="gray.50"
                      border="1px"
                      borderColor="gray.300"
                      color="gray.800"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700">Full Name</FormLabel>
                    <Input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      bg="gray.50"
                      border="1px"
                      borderColor="gray.300"
                      color="gray.800"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700">Avatar URL</FormLabel>
                    <Input
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      placeholder="Enter avatar URL"
                      bg="gray.50"
                      border="1px"
                      borderColor="gray.300"
                      color="gray.800"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel color="gray.700">Bio</FormLabel>
                    <Textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself"
                      bg="gray.50"
                      border="1px"
                      borderColor="gray.300"
                      color="gray.800"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={updateProfile.isLoading}
                  >
                    Save Changes
                  </Button>
                </VStack>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteAlertClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg="white">
              <AlertDialogHeader color="gray.800">Delete Gig</AlertDialogHeader>
              <AlertDialogBody color="gray.700">
                Are you sure you want to delete this gig? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteAlertClose} color="gray.600">
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteConfirm}
                  ml={3}
                  isLoading={deleteGig.isLoading}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    );
  }

  // Desktop Layout - Light Theme (same as mobile theme now)
  return (
    <Container maxW="container.xl" py={8}>
      {/* Profile Header - Desktop */}
      <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md" mb={6}>
        <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
          <Box flex="1">
            <Flex gap={3} align="center" mb={4}>
              <Avatar
                size={{ base: "md", md: "lg" }}
                name={profile?.full_name || profile?.username}
                src={profile?.avatar_url}
              />
              <VStack align="flex-start" spacing={0.5}>
                <Heading size={{ base: "sm", md: "md" }} color="gray.800">{profile?.full_name || profile?.username}</Heading>
                <Text color="gray.600" fontSize={{ base: "xs", md: "sm" }}>Web3 Developer</Text>
                <Text color="blue.600" fontSize="xs">
                  Member since {new Date(profile.created_at!).toLocaleDateString()}
                </Text>
              </VStack>
            </Flex>

            <Text color="gray.700" mb={3} fontSize={{ base: "xs", md: "sm" }}>
              {profile?.bio || 'No bio yet'}
            </Text>

            {isOwnProfile && (
              <Button
                onClick={onOpen}
                variant="outline"
                borderColor="blue.500"
                color="blue.500"
                _hover={{ bg: 'blue.50' }}
                size="sm"
              >
                Edit Profile
              </Button>
            )}
          </Box>

          <Box bg="gray.50" p={3} borderRadius="xl" minW={{ base: "100%", md: "200px" }}>
            <VStack spacing={3} align="stretch">
              <Box>
                <Text color="gray.600" fontSize="xs">Total Earnings</Text>
                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="green.600">
                  {totalEarnings} EGLD
                </Text>
              </Box>

              <Box>
                <Text color="gray.600" fontSize="xs">Completed Gigs</Text>
                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="blue.600">
                  {completedOrders.length}
                </Text>
              </Box>

              <Box>
                <Text color="gray.600" fontSize="xs">Average Rating</Text>
                <HStack>
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="gray.800">
                    {averageRating}
                  </Text>
                  {averageRating !== 'N/A' && (
                    <Star fill="#F59E0B" color="#F59E0B" size={16} />
                  )}
                </HStack>
              </Box>
            </VStack>
          </Box>
        </Flex>
      </Box>

      {/* Edit Profile Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="white">
          <ModalHeader color="gray.800">Edit Profile</ModalHeader>
          <ModalCloseButton color="gray.600" />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.700">Username</FormLabel>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    bg="gray.50"
                    border="1px"
                    borderColor="gray.300"
                    color="gray.800"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.700">Full Name</FormLabel>
                  <Input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    bg="gray.50"
                    border="1px"
                    borderColor="gray.300"
                    color="gray.800"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.700">Avatar URL</FormLabel>
                  <Input
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    placeholder="Enter avatar URL"
                    bg="gray.50"
                    border="1px"
                    borderColor="gray.300"
                    color="gray.800"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.700">Bio</FormLabel>
                  <Textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    bg="gray.50"
                    border="1px"
                    borderColor="gray.300"
                    color="gray.800"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={updateProfile.isLoading}
                >
                  Save Changes
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Profile Content - Desktop */}
      <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="md">
        <Tabs variant="unstyled" colorScheme="blue" size={{ base: "sm", md: "md" }}>
          <Box
            mx={-4}
            sx={{
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            <TabList
              mb={4}
              px={4}
              gap={{ base: 0.25, md: 2 }}
              flexWrap="nowrap"
              position="relative"
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-2px',
                  left: '4',
                  right: '4',
                  height: '2px',
                  bg: 'gray.200',
                  borderRadius: 'full',
                },
              }}
            >
              <Tab
                fontSize={{ base: '9px', md: 'sm' }}
                px={{ base: 0.5, md: 4 }}
                py={{ base: 0.5, md: 3 }}
                minW="auto"
                flexShrink={1}
                whiteSpace="normal"
                textOverflow="ellipsis"
                overflow="hidden"
                position="relative"
                color="gray.600"
                fontWeight="medium"
                transition="all 0.2s"
                _selected={{
                  color: 'blue.600',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-2px',
                    left: '0',
                    right: '0',
                    height: '2px',
                    bg: 'blue.600',
                    borderRadius: 'full',
                    zIndex: 1,
                  },
                }}
                _hover={{
                  color: 'blue.600',
                }}
              >
                Active Gigs
              </Tab>
              {isOwnProfile && (
                <Tab
                  fontSize={{ base: '9px', md: 'sm' }}
                  px={{ base: 0.5, md: 4 }}
                  py={{ base: 0.5, md: 3 }}
                  minW="auto"
                  flexShrink={1}
                  whiteSpace="normal"
                  textOverflow="ellipsis"
                  overflow="hidden"
                  position="relative"
                  color="gray.600"
                  fontWeight="medium"
                  transition="all 0.2s"
                  _selected={{
                    color: 'blue.600',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      right: '0',
                      height: '2px',
                      bg: 'blue.600',
                      borderRadius: 'full',
                      zIndex: 1,
                    },
                  }}
                  _hover={{
                    color: 'blue.600',
                  }}
                >
                  Orders
                </Tab>
              )}
              <Tab
                fontSize={{ base: '9px', md: 'sm' }}
                px={{ base: 0.5, md: 4 }}
                py={{ base: 0.5, md: 3 }}
                minW="auto"
                flexShrink={1}
                whiteSpace="normal"
                textOverflow="ellipsis"
                overflow="hidden"
                position="relative"
                color="gray.600"
                fontWeight="medium"
                transition="all 0.2s"
                _selected={{
                  color: 'blue.600',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-2px',
                    left: '0',
                    right: '0',
                    height: '2px',
                    bg: 'blue.600',
                    borderRadius: 'full',
                    zIndex: 1,
                  },
                }}
                _hover={{
                  color: 'blue.600',
                }}
              >
                Reviews
              </Tab>
              {isOwnProfile && (
                <Tab
                  fontSize={{ base: '9px', md: 'sm' }}
                  px={{ base: 0.5, md: 4 }}
                  py={{ base: 0.5, md: 3 }}
                  minW="auto"
                  flexShrink={1}
                  whiteSpace="normal"
                  textOverflow="ellipsis"
                  overflow="hidden"
                  position="relative"
                  color="gray.600"
                  fontWeight="medium"
                  transition="all 0.2s"
                  _selected={{
                    color: 'blue.600',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      right: '0',
                      height: '2px',
                      bg: 'blue.600',
                      borderRadius: 'full',
                      zIndex: 1,
                    },
                  }}
                  _hover={{
                    color: 'blue.600',
                  }}
                >
                  Settings
                </Tab>
              )}
            </TabList>
          </Box>

          <TabPanels>
            <TabPanel px={0}>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                {filteredGigs.length ? (
                  filteredGigs.map((gig, index) => {
                    const statusColor = getStatusColor(gig.category.toLowerCase());
                    const paymentToken = gig.payment_token || 'EGLD';
                    const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDA';
                    const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />;

                    return (
                      <Box
                        key={`${gig.id}-${index}`}
                        position="relative"
                        maxW="100%"
                        minH="18rem"
                        width="100%"
                        bg="white"
                        borderRadius="xl"
                        shadow="lg"
                        border="1px solid"
                        borderColor="gray.200"
                        transition="all 0.3s"
                        _hover={{
                          transform: "translateY(-5px)",
                          shadow: "xl",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/gigs/${gig.id}`)}
                      >
                        {/* Delete Button */}
                        {isOwnProfile && (
                          <IconButton
                            icon={<X size={16} />}
                            aria-label="Delete gig"
                            position="absolute"
                            top={2}
                            right={2}
                            size="xs"
                            colorScheme="red"
                            variant="outline"
                            bg="white"
                            onClick={(e) => handleDeleteClick(e, gig.id)}
                            zIndex={2}
                          />
                        )}

                        {/* Card Header */}
                        <Flex
                          justify="space-between"
                          align="center"
                          p={3}
                          borderBottom="1px solid"
                          borderColor="gray.200"
                        >
                          <Text color="gray.500" fontSize="xs">
                            {new Date(gig.created_at).toLocaleDateString()}
                          </Text>
                          <Badge
                            colorScheme="blue"
                            fontSize="xs"
                            px={2}
                            py={1}
                          >
                            {gig.category}
                          </Badge>
                        </Flex>

                        {/* Gig Image */}
                        <Box position="relative" h="120px">
                          <Image
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={gig.title}
                            objectFit="cover"
                            w="100%"
                            h="100%"
                          />
                        </Box>

                        {/* Card Content */}
                        <VStack spacing={3} p={3} align="stretch">
                          <Heading
                            size="sm"
                            color="gray.800"
                            noOfLines={2}
                            h="2.5rem"
                          >
                            {gig.title}
                          </Heading>

                          <Text
                            color="gray.600"
                            fontSize="xs"
                            noOfLines={2}
                            h="2rem"
                          >
                            {gig.description}
                          </Text>

                          <Box>
                            <Text color="gray.700" fontSize="xs" mb={1}>
                              Duration: {gig.duration} days
                            </Text>
                            <Progress
                              value={100}
                              colorScheme="blue"
                              size="sm"
                              bg="gray.200"
                            />
                          </Box>

                          <Flex justify="space-between" align="center" mt="auto">
                            <HStack>
                              {tokenIcon}
                              <Text
                                fontSize="md"
                                fontWeight="bold"
                                color="blue.600"
                              >
                                {gig.price} {tokenSymbol}
                              </Text>
                            </HStack>
                          </Flex>
                        </VStack>

                        {/* Add Edit Button */}
                        {isOwnProfile && (
                          <HStack position="absolute" bottom={3} left={3} spacing={1}>
                            <Button
                              leftIcon={<Edit2 size={14} />}
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              onClick={(e) => handleEditClick(e, gig.id)}
                              bg="white"
                            >
                              Edit
                            </Button>
                          </HStack>
                        )}
                      </Box>
                    );
                  })
                ) : (
                  <Text color="gray.600">No active gigs yet</Text>
                )}
              </Grid>
            </TabPanel>

            {isOwnProfile && (
              <TabPanel px={0}>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                  {profile?.orders?.length ? (
                    profile.orders.map((order, index) => {
                      const statusColor = getStatusColor(order.status);
                      const progressValue = getProgressValue(order.status);

                      return (
                        <Box
                          key={`${order.id}-${index}`}
                          position="relative"
                          maxW="100%"
                          minH="20rem"
                          width="100%"
                          display="flex"
                          flexDirection="column"
                          textAlign="center"
                          bg="white"
                          borderRadius="xl"
                          shadow="lg"
                          border="1px solid"
                          borderColor="gray.200"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          cursor="pointer"
                          _hover={{
                            transform: "translateY(-5px)",
                            shadow: "xl",
                          }}
                          transition="all 0.3s"
                        >
                          {/* Payment Status Badge */}
                          {getPaymentStatusBadge(order)}

                          {/* Card Header */}
                          <Box
                            width="100%"
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            px={4}
                            pt={3}
                            pb={2}
                          >
                            <Text color="gray.500" fontSize="xs">
                              {new Date(order.created_at).toLocaleDateString()}
                            </Text>
                            <Box cursor="pointer" color="gray.600">
                              <MoreVertical size={16} />
                            </Box>
                          </Box>

                          {/* Card Body - Compact */}
                          <Box
                            flex="1"
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            px={4}
                            py={3}
                          >
                            <Heading
                              color="gray.800"
                              fontSize="md"
                              mb={2}
                              textTransform="capitalize"
                              fontWeight="600"
                              noOfLines={2}
                            >
                              {order.gig?.title || "Custom Project"}
                            </Heading>
                            <Text color="gray.600" fontSize="xs" letterSpacing="0.031rem" mb={3}>
                              Order #{order.id.slice(0, 8)}
                            </Text>
                            
                            {/* Progress Section */}
                            <Box mb={3}>
                              <Text color="gray.700" textAlign="left" fontWeight="600" fontSize="xs" mb={1}>
                                Progress
                              </Text>
                              <Progress
                                value={progressValue}
                                colorScheme="blue"
                                size="sm"
                                bg="gray.200"
                                mb={1}
                              />
                              <Text color="gray.600" textAlign="right" fontSize="xs">
                                {progressValue}%
                              </Text>
                            </Box>

                            {/* Payment Status Section - Compact */}
                            {order.payment_status === 'pending_release' && (
                              <Box mb={3}>
                                <Text color="gray.700" textAlign="left" fontWeight="600" fontSize="xs" mb={1}>
                                  Payment Status
                                </Text>
                                <Box bg="gray.100" p={2} borderRadius="md">
                                  <Text color="gray.600" fontSize="xs">
                                    {timeLeftMap[order.id] === 'Ready to claim' ? 
                                      '🟢 Ready to claim' : 
                                      `⏰ Available in ${timeLeftMap[order.id] || 'calculating...'}`
                                    }
                                  </Text>
                                </Box>
                              </Box>
                            )}
                          </Box>

                          {/* Card Footer */}
                          <Box
                            width="100%"
                            borderTop="1px solid"
                            borderColor="gray.200"
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            px={4}
                            py={3}
                            bg="gray.50"
                            borderBottomLeftRadius="xl"
                            borderBottomRightRadius="xl"
                          >
                            <HStack spacing={1}>
                              <Avatar
                                size="xs"
                                name={order.gig?.provider?.username}
                                src={order.gig?.provider?.avatar_url}
                              />
                              <Avatar
                                size="xs"
                                name={order.client?.username}
                                src={order.client?.avatar_url}
                              />
                            </HStack>
                            
                            {/* Payment Status */}
                            {order.payment_status === 'pending_release' && (
                              <HStack>
                                {timeLeftMap[order.id] === 'Ready to claim' ? (
                                  <Button
                                    colorScheme="green"
                                    size="sm"
                                    leftIcon={<DollarSign size={12} />}
                                    onClick={() => handleClaimPayment(order.id)}
                                  >
                                    Claim Payment
                                  </Button>
                                ) : (
                                  <HStack>
                                    <Clock size={12} color="#F59E0B" />
                                    <Text color="orange.500" fontSize="xs">
                                      {timeLeftMap[order.id] || 'Calculating...'}
                                    </Text>
                                  </HStack>
                                )}
                              </HStack>
                            )}
                            
                            {order.payment_status !== 'pending_release' && (
                              <Text
                                bg="gray.100"
                                color="gray.800"
                                borderRadius="full"
                                px={3}
                                py={1}
                                fontSize="xs"
                              >
                                {order.amount} {order.payment_token || 'EGLD'}
                              </Text>
                            )}
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Text color="gray.600">No orders yet</Text>
                  )}
                </Grid>
              </TabPanel>
            )}

            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <Box
                      key={`${review.id}-${index}`}
                      bg="white"
                      p={4}
                      borderRadius="xl"
                      shadow="md"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <VStack align="stretch" spacing={3}>
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <Avatar
                              size="xs"
                              name={review.order?.client?.username}
                              src={review.order?.client?.avatar_url}
                            />
                            <VStack align="start" spacing={0}>
                              <Text color="gray.800" fontWeight="medium" fontSize="sm">
                                {review.order?.client?.username}
                              </Text>
                              <Text color="gray.500" fontSize="xs">
                                {new Date(review.created_at).toLocaleDateString()}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack>
                            {Array(5)
                              .fill('')
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  fill={i < review.rating ? '#F59E0B' : 'none'}
                                  color={i < review.rating ? '#F59E0B' : '#D1D5DB'}
                                />
                              ))}
                          </HStack>
                        </Flex>

                        <Box>
                          <Text color="gray.600" fontSize="xs" mb={1}>
                            Order: {review.order?.gig?.title}
                          </Text>
                          <Text color="gray.800" fontSize="sm">{review.comment}</Text>
                        </Box>
                      </VStack>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.600">No reviews yet</Text>
                )}
              </SimpleGrid>
            </TabPanel>

            {isOwnProfile && (
              <TabPanel px={0}>
                <Box bg="gray.50" p={4} borderRadius="xl">
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm" color="gray.800" mb={2}>
                      Notification Settings
                    </Heading>
                    <EmailNotificationsToggle enabled={profile?.email_notifications_enabled ?? true} />
                  </VStack>
                </Box>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="white">
            <AlertDialogHeader color="gray.800">Delete Gig</AlertDialogHeader>
            <AlertDialogBody color="gray.700">
              Are you sure you want to delete this gig? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose} color="gray.600">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                ml={3}
                isLoading={deleteGig.isLoading}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};